/**
 * Catchment controller.
 *
 * GET /api/villages/:masterId/catchment
 *
 * Uses the 2dsphere index on the `location` field of the `villages` collection
 * to find all villages within 5 km and 10 km of the selected village centroid,
 * then aggregates 2011 census demographic totals.
 */
const { connectDB } = require('../config/db');
const { resolveAndPersistVillageCoordinates } = require('../services/villageCoordinateService');

const EARTH_RADIUS_KM = 6378.1;

async function getCatchment(req, res) {
  const { masterId } = req.params;
  if (!masterId) return res.status(400).json({ detail: 'masterId is required' });

  try {
    const db = await connectDB();
    const col = db.collection('villages');

    // Find the anchor village
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
          location: 1,
        },
      }
    );

    if (!anchor) return res.status(404).json({ detail: 'Village not found' });

    // Use 12-state coordinates OR resolve via OpenStreetMap (Nominatim) and persist
    await resolveAndPersistVillageCoordinates(anchor);

    const loc = anchor.location;
    if (!loc || !loc.coordinates || loc.coordinates.length < 2) {
      return res.json({
        anchor,
        catchment_available: false,
        reason: 'No geospatial coordinates for this village',
      });
    }

    const [lon, lat] = loc.coordinates;

    function buildGeoFilter(radiusKm) {
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

    const [villages5, villages10] = await Promise.all([
      col.find(buildGeoFilter(5), { projection }).toArray(),
      col.find(buildGeoFilter(10), { projection }).toArray(),
    ]);

    res.json({
      anchor,
      catchment_available: true,
      catchment_5km: aggregateDemographics(villages5),
      catchment_10km: aggregateDemographics(villages10),
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}

module.exports = { getCatchment };
