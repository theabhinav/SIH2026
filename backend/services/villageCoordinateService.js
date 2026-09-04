/**
 * villageCoordinateService.js
 *
 * Resolves geospatial centroid coordinates for villages.
 *
 * Architecture:
 *   12-state dataset coordinates (already in MongoDB)
 *               OR
 *   OpenStreetMap (Nominatim) coordinates (for non-12-state villages)
 *               ↓
 *        SAME existing geo engine
 *               ↓
 *           5 km / 10 km
 *
 * OSM is strictly used ONLY for village centroid coordinates.
 * Never for businesses, schools, POIs, demographics, or amenities.
 */
const https = require('https');
const { connectDB } = require('../config/db');

// In-memory cache for resolved village coordinates
const villageMemoryCache = new Map();

/**
 * Make a single HTTPS GET request with timeout and User-Agent.
 */
function httpsGetJson(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'User-Agent': 'GrameenUdyogSIH2026/1.0 (Contact: sih2026@grameenudyog.local)',
        ...headers,
      },
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          reject(new Error(`JSON parse error from ${url.hostname}: ${data.slice(0, 150)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error(`Timeout requesting ${url.hostname}`));
    });
  });
}

/**
 * Query OpenStreetMap Nominatim for coordinates.
 */
async function queryOSM(queryStr) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=1`;
  try {
    const res = await httpsGetJson(url);
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const lat = parseFloat(res.data[0].lat);
      const lon = parseFloat(res.data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon, osmType: res.data[0].type || 'osm' };
      }
    }
  } catch (err) {
    console.warn('[OSM Nominatim] query failed for:', queryStr, err.message);
  }
  return null;
}

/**
 * Sanitizes village name by removing parenthetical census codes like "(250)" or "(CT)".
 */
function cleanName(name) {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Resolves village coordinates:
 * 1. Returns existing 12-state coordinates if present.
 * 2. Checks geocache (memory and MongoDB).
 * 3. Queries OpenStreetMap (Nominatim) using hierarchical geographic fallback:
 *    Tier A: Village, District, State, India
 *    Tier B: Village, Block, District, State, India
 *    Tier C: Village, State, India
 *    Tier D: Block, District, State, India (OSM block centroid)
 *    Tier E: District, State, India (OSM district centroid)
 * 4. Persists resolved coordinates into MongoDB `villages` and `geocache`.
 *
 * @param {Object} villageDoc - Village document from MongoDB
 * @returns {Promise<{lat: number|null, lon: number|null, location: Object|null, source: string, resolved: boolean}>}
 */
async function resolveAndPersistVillageCoordinates(villageDoc) {
  if (!villageDoc) return { lat: null, lon: null, location: null, source: 'none', resolved: false };

  // 1. Check if village ALREADY has valid coordinates (e.g. from 12-state dataset)
  const existingLat = typeof villageDoc.centroid_latitude === 'number'
    ? villageDoc.centroid_latitude
    : (villageDoc.latitude != null && !isNaN(Number(villageDoc.latitude)) ? Number(villageDoc.latitude) : null);

  const existingLon = typeof villageDoc.centroid_longitude === 'number'
    ? villageDoc.centroid_longitude
    : (villageDoc.longitude != null && !isNaN(Number(villageDoc.longitude)) ? Number(villageDoc.longitude) : null);

  if (existingLat !== null && existingLon !== null) {
    const loc = villageDoc.location || { type: 'Point', coordinates: [existingLon, existingLat] };
    return {
      lat: existingLat,
      lon: existingLon,
      location: loc,
      source: villageDoc.coordinates_source || '12_state_dataset',
      resolved: true,
    };
  }

  // 2. Village is outside 12-state dataset or has missing coordinates. Check cache.
  const vName = cleanName(villageDoc.village_name);
  const bName = cleanName(villageDoc.block_name);
  const dName = cleanName(villageDoc.district_name);
  const sName = cleanName(villageDoc.state_name);

  const cacheKey = `vill_osm:${vName.toLowerCase()}:${dName.toLowerCase()}:${sName.toLowerCase()}`;

  // Check in-memory cache
  if (villageMemoryCache.has(cacheKey)) {
    const mem = villageMemoryCache.get(cacheKey);
    if (mem.resolved) {
      applyCoords(villageDoc, mem.lat, mem.lon, mem.source);
      return mem;
    }
  }

  // Check MongoDB geocache
  const db = await connectDB();
  const geoCol = db.collection('geocache');
  const cached = await geoCol.findOne({ key: cacheKey });
  if (cached && cached.resolved && cached.lat != null && cached.lon != null) {
    const res = {
      lat: cached.lat,
      lon: cached.lon,
      location: { type: 'Point', coordinates: [cached.lon, cached.lat] },
      source: cached.coordinates_source || 'osm_nominatim',
      resolved: true,
    };
    villageMemoryCache.set(cacheKey, res);
    applyCoords(villageDoc, res.lat, res.lon, res.source);
    // Also ensure villages collection is updated
    await persistToVillages(db, villageDoc.master_id, res.lat, res.lon, res.source);
    return res;
  }

  // 3. Query OpenStreetMap (Nominatim) hierarchically
  let osmResult = null;
  let source = 'osm_nominatim_village';

  // Tier A: Village, District, State, India
  if (vName && dName && sName) {
    osmResult = await queryOSM(`${vName}, ${dName}, ${sName}, India`);
  }

  // Tier B: Village, Block, District, State, India (if Tier A failed)
  if (!osmResult && vName && bName && dName && sName && bName !== vName) {
    await new Promise((r) => setTimeout(r, 400));
    osmResult = await queryOSM(`${vName}, ${bName}, ${dName}, ${sName}, India`);
  }

  // Tier C: Village, State, India (if Tier B failed)
  if (!osmResult && vName && sName) {
    await new Promise((r) => setTimeout(r, 400));
    osmResult = await queryOSM(`${vName}, ${sName}, India`);
  }

  // Tier D: Fallback to Block centroid from OSM if village node itself is unmapped
  if (!osmResult && bName && dName && sName) {
    await new Promise((r) => setTimeout(r, 400));
    osmResult = await queryOSM(`${bName}, ${dName}, ${sName}, India`);
    if (osmResult) source = 'osm_nominatim_block';
  }

  // Tier E: Fallback to District centroid from OSM as last resort
  if (!osmResult && dName && sName) {
    await new Promise((r) => setTimeout(r, 400));
    osmResult = await queryOSM(`${dName}, ${sName}, India`);
    if (osmResult) source = 'osm_nominatim_district';
  }

  if (osmResult && osmResult.lat != null && osmResult.lon != null) {
    const result = {
      lat: osmResult.lat,
      lon: osmResult.lon,
      location: { type: 'Point', coordinates: [osmResult.lon, osmResult.lat] },
      source,
      resolved: true,
    };

    // Cache in memory
    villageMemoryCache.set(cacheKey, result);

    // Persist to MongoDB geocache
    await geoCol.updateOne(
      { key: cacheKey },
      {
        $set: {
          key: cacheKey,
          lat: result.lat,
          lon: result.lon,
          coordinates_source: source,
          osm_type: osmResult.osmType,
          resolved: true,
          resolved_at: new Date(),
        },
      },
      { upsert: true }
    );

    // Persist to MongoDB villages collection
    await persistToVillages(db, villageDoc.master_id, result.lat, result.lon, source);

    // Mutate in-memory document
    applyCoords(villageDoc, result.lat, result.lon, source);

    return result;
  }

  // If completely unresolvable
  const failed = {
    lat: null,
    lon: null,
    location: null,
    source: 'none',
    resolved: false,
  };
  villageMemoryCache.set(cacheKey, failed);
  return failed;
}

function applyCoords(doc, lat, lon, source) {
  if (!doc) return;
  doc.centroid_latitude = lat;
  doc.centroid_longitude = lon;
  doc.latitude = lat;
  doc.longitude = lon;
  doc.location = lat != null && lon != null ? { type: 'Point', coordinates: [lon, lat] } : null;
  doc.coordinates_source = source;
}

async function persistToVillages(db, masterId, lat, lon, source) {
  if (!masterId || lat == null || lon == null) return;
  try {
    await db.collection('villages').updateOne(
      { master_id: masterId },
      {
        $set: {
          centroid_latitude: lat,
          centroid_longitude: lon,
          latitude: lat,
          longitude: lon,
          location: { type: 'Point', coordinates: [lon, lat] },
          coordinates_source: source,
          coordinate_match_status: 'osm_resolved',
          coordinates_resolved_at: new Date(),
        },
      }
    );
  } catch (err) {
    console.warn('[villageCoordinateService] Failed to persist coordinates to villages collection:', err.message);
  }
}

module.exports = {
  resolveAndPersistVillageCoordinates,
  queryOSM,
};
