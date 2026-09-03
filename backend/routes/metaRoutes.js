const express = require('express');
const router = express.Router();
const { getLocations, getBusinessCategories } = require('../controllers/metaController');

router.get('/locations', getLocations);
router.get('/business-categories', getBusinessCategories);

module.exports = router;
