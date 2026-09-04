const express = require('express');
const router = express.Router();
const { getCatchment } = require('../controllers/catchmentController');

// GET /api/villages/:masterId/catchment
router.get('/:masterId/catchment', getCatchment);

module.exports = router;
