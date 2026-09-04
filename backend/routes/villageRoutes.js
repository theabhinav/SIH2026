const express = require('express');
const router = express.Router();
const { searchVillages, getVillageCoordinates } = require('../controllers/villageController');

// GET /api/villages/search?q=<village-name>
router.get('/search', searchVillages);

// GET /api/villages/:masterId/coordinates
router.get('/:masterId/coordinates', getVillageCoordinates);

module.exports = router;
