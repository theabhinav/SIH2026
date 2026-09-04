const express = require('express');
const router = express.Router();
const { getMarketIntelligence } = require('../controllers/marketIntelligenceController');

// GET /api/market-intelligence?masterId=...&category=...
router.get('/', getMarketIntelligence);

module.exports = router;
