const { LOCATIONS } = require('../constants/locationsData');
const { BUSINESS_CATEGORIES } = require('../constants/businessData');

function getLocations(req, res) {
  res.json(LOCATIONS);
}

function getBusinessCategories(req, res) {
  res.json(BUSINESS_CATEGORIES);
}

module.exports = { getLocations, getBusinessCategories };
