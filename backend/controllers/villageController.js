const { getDB } = require('../config/db');
const {
  normalizeVillageQuery,
  escapeRegex,
  VILLAGE_SEARCH_PROJECTION,
  formatVillageResult
} = require('../utils/villageSearchUtils');

const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Searches the MongoDB `villages` collection by village name.
 *
 * Query Parameters:
 *   - q: (required) Search query string
 *   - limit: (optional) Maximum results to return (default 20, max 100)
 *
 * Ranking & Search Behavior:
 *   1. Exact village name matches (indexed via `idx_village_name_norm`)
 *   2. Prefix village name matches (indexed via `idx_village_name_norm`)
 *   3. Partial / token matches (leveraging text index `idx_village_name_text` and bounded substring fallback)
 *
 * Disambiguation:
 *   Returns all matching records with full administrative hierarchy
 *   (state, district, block, census codes) and centroid coordinates.
 */
async function searchVillages(req, res) {
  try {
    const rawQ = req.query.q;

    // 1. Validation: Missing or non-string query
    if (rawQ === undefined || rawQ === null || typeof rawQ !== 'string') {
      return res.status(400).json({
        detail: "Query parameter 'q' is required",
        error: "Query parameter 'q' is required"
      });
    }

    const trimmedQ = rawQ.trim();

    // 2. Validation: Empty query
    if (trimmedQ.length === 0) {
      return res.status(400).json({
        detail: "Query parameter 'q' cannot be empty",
        error: "Query parameter 'q' cannot be empty"
      });
    }

    // 3. Validation: Max query length
    if (trimmedQ.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        detail: `Query parameter 'q' exceeds maximum length of ${MAX_QUERY_LENGTH} characters`,
        error: `Query parameter 'q' exceeds maximum length of ${MAX_QUERY_LENGTH} characters`
      });
    }

    // 4. Normalization
    const normalizedQ = normalizeVillageQuery(trimmedQ);
    if (normalizedQ.length === 0) {
      return res.status(400).json({
        detail: "Query parameter 'q' must contain at least one alphanumeric character",
        error: "Query parameter 'q' must contain at least one alphanumeric character"
      });
    }

    // 5. Result limit handling
    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = (!isNaN(parsedLimit) && parsedLimit > 0)
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

    const db = getDB();
    const collection = db.collection('villages');

    const results = [];
    const seenMasterIds = new Set();

    // STAGE 1: Exact matches using B-tree index on village_name_normalized
    const exactDocs = await collection
      .find(
        { village_name_normalized: normalizedQ },
        { projection: VILLAGE_SEARCH_PROJECTION }
      )
      .limit(limit)
      .toArray();

    for (const doc of exactDocs) {
      if (!seenMasterIds.has(doc.master_id)) {
        results.push(doc);
        seenMasterIds.add(doc.master_id);
      }
    }

    // STAGE 2: Prefix matches using B-tree index on village_name_normalized
    if (results.length < limit) {
      const remaining = limit - results.length;
      const prefixRegex = new RegExp('^' + escapeRegex(normalizedQ));

      const prefixDocs = await collection
        .find(
          {
            village_name_normalized: {
              $regex: prefixRegex,
              $ne: normalizedQ
            }
          },
          { projection: VILLAGE_SEARCH_PROJECTION }
        )
        .limit(remaining)
        .toArray();

      for (const doc of prefixDocs) {
        if (!seenMasterIds.has(doc.master_id)) {
          results.push(doc);
          seenMasterIds.add(doc.master_id);
        }
      }
    }

    // STAGE 3: Partial / token matches (only if still below limit)
    if (results.length < limit) {
      const remainingForText = limit - results.length;

      // 3A. Inverted Text index match on village_name
      try {
        const textFilter = {
          $text: { $search: trimmedQ }
        };
        if (seenMasterIds.size > 0) {
          textFilter.master_id = { $nin: Array.from(seenMasterIds) };
        }

        const textDocs = await collection
          .find(
            textFilter,
            {
              projection: {
                ...VILLAGE_SEARCH_PROJECTION,
                score: { $meta: 'textScore' }
              }
            }
          )
          .sort({ score: { $meta: 'textScore' } })
          .limit(remainingForText)
          .toArray();

        for (const doc of textDocs) {
          if (!seenMasterIds.has(doc.master_id)) {
            results.push(doc);
            seenMasterIds.add(doc.master_id);
          }
        }
      } catch (textErr) {
        // Fall through safely if text query encounters any issue
      }

      // 3B. Bounded regex substring match on normalized field for queries of 3+ chars
      if (results.length < limit && normalizedQ.length >= 3) {
        const remainingForPartial = limit - results.length;
        try {
          const partialFilter = {
            village_name_normalized: {
              $regex: new RegExp(escapeRegex(normalizedQ))
            }
          };
          if (seenMasterIds.size > 0) {
            partialFilter.master_id = { $nin: Array.from(seenMasterIds) };
          }

          const partialDocs = await collection
            .find(partialFilter, { projection: VILLAGE_SEARCH_PROJECTION })
            .maxTimeMS(600)
            .limit(remainingForPartial)
            .toArray();

          for (const doc of partialDocs) {
            if (!seenMasterIds.has(doc.master_id)) {
              results.push(doc);
              seenMasterIds.add(doc.master_id);
            }
          }
        } catch (partialErr) {
          // Bounded timeout safety (maxTimeMS)
        }
      }
    }

    // Format results to exact concise specification
    const formatted = results.map(formatVillageResult);
    return res.json(formatted);
  } catch (err) {
    console.error('❌ Village search error:', err);
    return res.status(500).json({
      detail: 'Internal server error while searching villages',
      error: err.message
    });
  }
}

/**
 * GET /api/villages/:masterId/coordinates
 * Returns village coordinates, resolving from OpenStreetMap (Nominatim)
 * if missing, and persisting to MongoDB villages collection.
 */
async function getVillageCoordinates(req, res) {
  const { masterId } = req.params;
  if (!masterId) return res.status(400).json({ detail: 'masterId is required' });

  try {
    const db = getDB();
    const { resolveAndPersistVillageCoordinates } = require('../services/villageCoordinateService');
    const village = await db.collection('villages').findOne({ master_id: masterId });
    if (!village) return res.status(404).json({ detail: 'Village not found' });

    const coordResult = await resolveAndPersistVillageCoordinates(village);

    return res.json({
      master_id: village.master_id,
      village_name: village.village_name,
      block_name: village.block_name || '',
      district_name: village.district_name,
      state_name: village.state_name,
      centroid_latitude: coordResult.lat,
      centroid_longitude: coordResult.lon,
      latitude: coordResult.lat,
      longitude: coordResult.lon,
      location: coordResult.location,
      coordinates_source: coordResult.source,
      resolved: coordResult.resolved,
    });
  } catch (err) {
    console.error('❌ Error getting village coordinates:', err);
    return res.status(500).json({ detail: err.message });
  }
}

module.exports = {
  searchVillages,
  getVillageCoordinates,
};
