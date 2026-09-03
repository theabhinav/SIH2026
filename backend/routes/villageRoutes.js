const express = require('express');
const router = express.Router();
const { searchVillages } = require('../controllers/villageController');

// GET /api/villages/search?q=<village-name>
router.get('/search', searchVillages);

module.exports = router;
