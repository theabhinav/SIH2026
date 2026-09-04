/**
 * Normalizes a user query by trimming, converting to lower-case,
 * and stripping all non-alphanumeric characters.
 * Matches the normalization applied during village master CSV import.
 *
 * @param {string} q
 * @returns {string}
 */
function normalizeVillageQuery(q) {
  if (!q || typeof q !== 'string') return '';
  return q.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Escapes characters with special meaning in Regular Expressions.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Concise projection object for MongoDB query.
 * Excludes MongoDB _id and all bulky demographic census columns.
 */
const VILLAGE_SEARCH_PROJECTION = {
  _id: 0,
  master_id: 1,
  village_name: 1,
  village_descriptive_name: 1,
  state_name: 1,
  state_code: 1,
  district_name: 1,
  district_code: 1,
  block_name: 1,
  block_code: 1,
  village_census_code: 1,
  village_code_2011: 1,
  census_2011_code: 1,
  census_2001_code: 1,
  centroid_latitude: 1,
  centroid_longitude: 1,
  latitude: 1,
  longitude: 1,
  location: 1
};

/**
 * Formats a village database document into the concise schema required by the API.
 * Guarantees all specified fields are present and cleanly typed.
 *
 * @param {object} doc
 * @returns {object}
 */
function formatVillageResult(doc) {
  const lat = typeof doc.centroid_latitude === 'number'
    ? doc.centroid_latitude
    : (doc.latitude != null && !isNaN(Number(doc.latitude)) ? Number(doc.latitude) : null);

  const lon = typeof doc.centroid_longitude === 'number'
    ? doc.centroid_longitude
    : (doc.longitude != null && !isNaN(Number(doc.longitude)) ? Number(doc.longitude) : null);

  return {
    master_id: doc.master_id || '',
    village_name: doc.village_name || '',
    village_descriptive_name: doc.village_descriptive_name || doc.village_name || '',
    state_name: doc.state_name || '',
    state_code: doc.state_code != null ? String(doc.state_code) : '',
    district_name: doc.district_name || '',
    district_code: doc.district_code != null ? String(doc.district_code) : '',
    block_name: doc.block_name || '',
    block_code: doc.block_code != null ? String(doc.block_code) : '',
    village_census_code: doc.village_census_code || doc.village_code_2011 || doc.census_2011_code || '',
    village_code_2011: doc.village_code_2011 || doc.census_2011_code || '',
    census_2011_code: doc.census_2011_code || doc.village_code_2011 || '',
    census_2001_code: doc.census_2001_code || '',
    centroid_latitude: lat,
    centroid_longitude: lon,
    latitude: lat,
    longitude: lon,
    location: doc.location || (lat !== null && lon !== null ? { type: 'Point', coordinates: [lon, lat] } : null)
  };
}

module.exports = {
  normalizeVillageQuery,
  escapeRegex,
  VILLAGE_SEARCH_PROJECTION,
  formatVillageResult
};
