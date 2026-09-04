/**
 * Cascading location hierarchy routes.
 *
 * GET /api/locations/states                              → all distinct states
 * GET /api/locations/districts?state=<state>             → distinct districts in state
 * GET /api/locations/villages?state=...&district=...&q=  → villages in that district
 *
 * These query the existing MongoDB `villages` collection.
 * They do NOT touch the hardcoded /api/locations (legacy) endpoint.
 */
const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/db');

// GET /api/locations/states
router.get('/states', async (req, res) => {
  try {
    const db = await connectDB();
    const states = await db.collection('villages').distinct('state_name');
    states.sort();
    res.json({ states });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/locations/districts?state=<state>
router.get('/districts', async (req, res) => {
  const { state } = req.query;
  if (!state) return res.status(400).json({ detail: 'state query param is required' });
  try {
    const db = await connectDB();
    const districts = await db.collection('villages').distinct('district_name', { state_name: state });
    districts.sort();
    res.json({ districts });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/locations/villages?state=...&district=...&q=<optional partial name>
router.get('/villages', async (req, res) => {
  const { state, district, q } = req.query;
  if (!state || !district) {
    return res.status(400).json({ detail: 'state and district query params are required' });
  }
  try {
    const db = await connectDB();
    const filter = { state_name: state, district_name: district };
    if (q && q.trim()) {
      filter.village_name = {
        $regex: q.trim().replace(/[<>{}]/g, ''),
        $options: 'i',
      };
    }
    const rawVillages = await db
      .collection('villages')
      .find(filter, {
        projection: {
          _id: 0,
          master_id: 1,
          village_name: 1,
          village_descriptive_name: 1,
          block_name: 1,
          block_code: 1,
          district_name: 1,
          district_code: 1,
          state_name: 1,
          state_code: 1,
          village_census_code: 1,
          village_code_2011: 1,
          census_2011_code: 1,
          census_2001_code: 1,
          centroid_latitude: 1,
          centroid_longitude: 1,
          latitude: 1,
          longitude: 1,
          location: 1,
        },
      })
      .sort({ village_name: 1 })
      .limit(200)
      .toArray();

    const villages = rawVillages.map(doc => {
      const lat = typeof doc.centroid_latitude === 'number'
        ? doc.centroid_latitude
        : (doc.latitude != null && !isNaN(Number(doc.latitude)) ? Number(doc.latitude) : null);
      const lon = typeof doc.centroid_longitude === 'number'
        ? doc.centroid_longitude
        : (doc.longitude != null && !isNaN(Number(doc.longitude)) ? Number(doc.longitude) : null);

      return {
        ...doc,
        centroid_latitude: lat,
        centroid_longitude: lon,
        latitude: lat,
        longitude: lon,
        location: doc.location || (lat !== null && lon !== null ? { type: 'Point', coordinates: [lon, lat] } : null)
      };
    });

    res.json({ villages });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
