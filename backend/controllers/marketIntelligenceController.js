/**
 * Market Intelligence Controller
 *
 * GET /api/market-intelligence?masterId=<master_id>&category=<business_category>
 *
 * Returns:
 *   - anchor:            Selected village details
 *   - catchment_5km:     Demographic aggregates from villages within 5 km
 *   - catchment_10km:    Demographic aggregates from villages within 10 km
 *   - competitors_5km:   Count of same-category MSME enterprises geographically within 5 km
 *   - competitors_10km:  Count of same-category MSME enterprises geographically within 10 km
 *   - enterprises:       Array of enterprises within 10 km (with coords) for map
 *   - competition_level: "Low" / "Medium" / "High"
 *   - msme_summary:      District-level MSME stats (total, analyzed, matched, with_coords, unresolved)
 *   - data_notes:        Transparency about methodology and limitations
 */
const { connectDB } = require('../config/db');
const { resolveAndPersistVillageCoordinates } = require('../services/villageCoordinateService');
const {
  fetchDistrictEnterprises,
  resolveEnterpriseLocation,
  prepopulateDistrictGeocache,
  normalizePin,
  parseActivities,
  distKm,
} = require('../services/msmeClient');
const { matchesCategory } = require('../constants/nicMapping');

const EARTH_RADIUS_KM = 6378.1;

function geoFilter(lon, lat, radiusKm) {
  return {
    location: {
      $geoWithin: {
        $centerSphere: [[lon, lat], radiusKm / EARTH_RADIUS_KM],
      },
    },
  };
}

function aggregateDemographics(villages) {
  let pop = 0, hh = 0, male = 0, female = 0, lit = 0, sc = 0, st = 0, workers = 0;
  let missingCount = 0;
  let hasUrbanTown = false;

  for (const v of villages) {
    if (v.census_2011_tot_p == null) {
      missingCount++;
      if (
        v.village_category === 'Urban' ||
        /\b(ct|town)\b/i.test(v.village_name || '') ||
        /\btown\b/i.test(v.local_body_type_name || '')
      ) {
        hasUrbanTown = true;
      }
    } else {
      pop += v.census_2011_tot_p;
      hh += v.census_2011_no_hh || 0;
      male += v.census_2011_tot_m || 0;
      female += v.census_2011_tot_f || 0;
      lit += v.census_2011_p_lit || 0;
      sc += v.census_2011_p_sc || 0;
      st += v.census_2011_p_st || 0;
      workers += v.census_2011_tot_work_p || 0;
    }
  }

  const allMissing = villages.length > 0 && missingCount === villages.length;
  const demographicsAvailable = villages.length > 0 && !allMissing;

  let reason = null;
  if (allMissing) {
    reason = hasUrbanTown
      ? 'Data unavailable (Urban Census Town)'
      : 'Data unavailable (Census 2011 record not mapped)';
  } else if (missingCount > 0) {
    reason = `${villages.length - missingCount} of ${villages.length} villages mapped`;
  }

  return {
    village_count: villages.length,
    demographics_available: demographicsAvailable,
    missing_demographics_count: missingCount,
    reason,
    population: demographicsAvailable ? pop : null,
    households: demographicsAvailable ? hh : null,
    male: demographicsAvailable ? male : null,
    female: demographicsAvailable ? female : null,
    literate: demographicsAvailable ? lit : null,
    sc: demographicsAvailable ? sc : null,
    st: demographicsAvailable ? st : null,
    workers: demographicsAvailable ? workers : null,
  };
}

function competitionLevel(count5km) {
  if (count5km <= 2) return 'Low';
  if (count5km <= 7) return 'Medium';
  return 'High';
}

async function getMarketIntelligence(req, res) {
  const { masterId, category } = req.query;
  if (!masterId || !category) {
    return res.status(400).json({ detail: 'masterId and category are required' });
  }

  try {
    const db = await connectDB();
    const col = db.collection('villages');

    // ── 1. Resolve anchor village ──────────────────────────────────────────
    const anchor = await col.findOne(
      { master_id: masterId },
      {
        projection: {
          _id: 0,
          master_id: 1,
          village_name: 1,
          block_name: 1,
          district_name: 1,
          state_name: 1,
          centroid_latitude: 1,
          centroid_longitude: 1,
          latitude: 1,
          longitude: 1,
          location: 1,
        },
      }
    );

    if (!anchor) return res.status(404).json({ detail: 'Village not found' });

    // Use 12-state dataset coordinates OR resolve via OpenStreetMap (Nominatim) and persist
    await resolveAndPersistVillageCoordinates(anchor);

    const hasCentroid = !!(anchor.location && anchor.location.coordinates && anchor.location.coordinates.length === 2);

    // ── 2. Geographic village catchment (MongoDB) ─────────────────────────
    let catchment_5km = null;
    let catchment_10km = null;

    if (hasCentroid) {
      const [lon, lat] = anchor.location.coordinates;
      const projection = {
        _id: 0,
        village_name: 1,
        village_category: 1,
        local_body_type_name: 1,
        census_2011_tot_p: 1,
        census_2011_no_hh: 1,
        census_2011_tot_m: 1,
        census_2011_tot_f: 1,
        census_2011_p_lit: 1,
        census_2011_p_sc: 1,
        census_2011_p_st: 1,
        census_2011_tot_work_p: 1,
      };
      const [v5, v10] = await Promise.all([
        col.find(geoFilter(lon, lat, 5), { projection }).toArray(),
        col.find(geoFilter(lon, lat, 10), { projection }).toArray(),
      ]);
      catchment_5km = aggregateDemographics(v5);
      catchment_10km = aggregateDemographics(v10);
    }

    // ── 3. Fetch MSME district enterprises (paginated) ─────────────────────
    let msmeResult;
    try {
      msmeResult = await fetchDistrictEnterprises(anchor.state_name, anchor.district_name);
    } catch (msmeErr) {
      console.error('[market-intelligence] MSME fetch failed:', msmeErr.message);
      if (msmeErr.code === 'UNCONFIGURED') {
        return res.status(503).json({
          detail: 'MSME/Udyam API key is not configured in backend/.env',
          api_status: 'unconfigured',
        });
      }
      return res.status(502).json({
        detail: `Upstream MSME data source error: ${msmeErr.message}`,
        api_status: 'upstream_error',
      });
    }

    const { records, total: msmeTotal, fetched, apiDistrict } = msmeResult;

    // ── 4. Generic NIC / category filter in-process ────────────────────────
    const matched = [];
    for (const rec of records) {
      const activities = parseActivities(rec.Activities);
      if (matchesCategory(activities, category)) {
        matched.push({ rec, activities });
      }
    }

    // ── 5. Enterprise location resolution & distance calculation ───────────
    let competitors_5km = 0;
    let competitors_10km = 0;
    let resolvedCount = 0;
    let unresolvedCount = 0;
    const enterprisesOnMap = [];

    const [anchorLon, anchorLat] = hasCentroid ? anchor.location.coordinates : [null, null];

    // Pre-populate in-memory geocache for the district so lookups are instantaneous
    await prepopulateDistrictGeocache(anchor.district_name);

    for (const { rec, activities } of matched) {
      const loc = await resolveEnterpriseLocation(rec, anchor.district_name, anchor.state_name);

      if (loc && loc.resolved && loc.lat != null && loc.lon != null) {
        resolvedCount++;

        let dist = null;
        if (hasCentroid) {
          dist = distKm(anchorLat, anchorLon, loc.lat, loc.lon);
        }

        if (dist !== null) {
          if (dist <= 5.0) {
            competitors_5km++;
            competitors_10km++;
          } else if (dist <= 10.0) {
            competitors_10km++;
          }

          if (dist <= 10.0) {
            enterprisesOnMap.push({
              name: rec.EnterpriseName,
              pincode: normalizePin(rec.Pincode) || '',
              address: rec.CommunicationAddress || '',
              lat: loc.lat,
              lon: loc.lon,
              dist_km: Math.round(dist * 10) / 10,
              coordinates_source: loc.coordinates_source,
              coordinate_accuracy: loc.coordinate_accuracy,
              activities: activities.map((a) => a.Description || a.NIC5DigitId).filter(Boolean).join('; '),
            });
          }
        }
      } else {
        unresolvedCount++;
      }
    }

    // Sort map enterprises by distance ascending
    enterprisesOnMap.sort((a, b) => a.dist_km - b.dist_km);

    // ── 6. Build response ────────────────────────────────────────────────
    const isCompleteAnalysis = fetched >= msmeTotal && msmeTotal > 0;
    const data_notes = [
      isCompleteAnalysis
        ? `Complete district analysis: 100% of all ${fetched.toLocaleString('en-IN')} official Udyam enterprises in ${apiDistrict || anchor.district_name}, ${anchor.state_name} were analyzed.`
        : `MSME data covers ${fetched.toLocaleString('en-IN')} of ${msmeTotal.toLocaleString('en-IN')} enterprises in ${apiDistrict || anchor.district_name}, ${anchor.state_name}.`,
      `${matched.length.toLocaleString('en-IN')} enterprises matched the "${category}" business category across the complete district records.`,
      hasCentroid
        ? `${enterprisesOnMap.length.toLocaleString('en-IN')} relevant enterprises are geographically within 10 km (${competitors_5km.toLocaleString('en-IN')} within 5 km). Resolved via ${resolvedCount.toLocaleString('en-IN')} usable locations (${unresolvedCount.toLocaleString('en-IN')} unresolvable addresses excluded from radius).`
        : 'No geospatial coordinates available for this village — distance calculations are unavailable.',
      'Activities filter is evaluated against official National Industrial Classification (NIC 2008) 5-digit and 4-digit codes.',
    ];

    res.json({
      anchor,
      catchment_5km,
      catchment_10km,
      catchment_available: hasCentroid,
      competitors_5km,
      competitors_10km,
      competition_level: competitionLevel(competitors_5km),
      enterprises: enterprisesOnMap.slice(0, 100), // top 100 closest for map
      msme_summary: {
        district: anchor.district_name,
        state: anchor.state_name,
        api_district: apiDistrict,
        total_in_district: msmeTotal,
        fetched_for_analysis: fetched,
        matched_category: matched.length,
        with_usable_coordinates: resolvedCount,
        unresolved_locations: unresolvedCount,
      },
      data_notes,
    });
  } catch (err) {
    console.error('[market-intelligence]', err.message);
    res.status(500).json({ detail: err.message });
  }
}

module.exports = { getMarketIntelligence };
