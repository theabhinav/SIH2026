const path = require('path');
const https = require('https');
const { connectDB } = require('../config/db');

const RESOURCE_ID = '8b68ae56-84cf-4728-a0a6-1be11028dea7';
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;
const PAGE_SIZE = 10000;

// In-memory geocache to avoid duplicate queries within the process
const memoryGeoCache = new Map();
// Cache of state -> available district list from Udyam API
const stateDistrictsCache = new Map();

/**
 * Haversine distance in km between two lat/lon pairs.
 */
function distKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6378.1;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Normalize pincode from MSME API (e.g. "517425.0" -> "517425")
 */
function normalizePin(pin) {
  if (!pin) return null;
  const cleaned = String(pin).trim().split('.')[0].trim();
  return /^\d{6}$/.test(cleaned) ? cleaned : null;
}

/**
 * Normalize district string for fuzzy matching (strips non-letters, collapses repeated letters).
 */
function normalizeDistrictName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');
}

/**
 * Parse the Activities JSON string from an MSME record.
 */
function parseActivities(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Make a single HTTPS GET request with timeout.
 */
function httpsGetJson(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'User-Agent': 'GrameenUdyogSIH2026/1.0',
        ...headers,
      },
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          reject(new Error(`JSON parse error from ${url.hostname}: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout requesting ${url.hostname}`));
    });
  });
}

/**
 * Fetch one page from MSME API.
 */
async function fetchPage(state, district, offset) {
  const apiKey = process.env.MSME_API_KEY;
  if (!apiKey) {
    const err = new Error('MSME_API_KEY is not configured in backend/.env');
    err.code = 'UNCONFIGURED';
    throw err;
  }

  const url = new URL(BASE_URL);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('filters[State]', state);
  if (district) {
    url.searchParams.set('filters[District]', district);
  }

  const res = await httpsGetJson(url.toString());
  if (res.status !== 200) {
    const err = new Error(`MSME API responded with status ${res.status}`);
    err.code = 'UPSTREAM_ERROR';
    throw err;
  }

  return res.data;
}

/**
 * Resolves the district spelling as stored in the Udyam API.
 */
async function resolveApiDistrict(state, inputDistrict) {
  const stateUpper = state.toUpperCase();

  // 1. Try exact uppercase
  try {
    const pageUpper = await fetchPage(stateUpper, inputDistrict.toUpperCase(), 0);
    if (pageUpper && pageUpper.total > 0) {
      return { apiDistrict: inputDistrict.toUpperCase(), firstPage: pageUpper };
    }
  } catch (e) {
    if (e.code === 'UNCONFIGURED') throw e;
  }

  // 2. Try original Title Case
  try {
    const pageTitle = await fetchPage(stateUpper, inputDistrict, 0);
    if (pageTitle && pageTitle.total > 0) {
      return { apiDistrict: inputDistrict, firstPage: pageTitle };
    }
  } catch (e) {
    if (e.code === 'UNCONFIGURED') throw e;
  }

  // 3. Check cached district list or fetch state's available districts
  let apiDistricts = stateDistrictsCache.get(stateUpper);
  if (!apiDistricts) {
    try {
      const stateSample = await fetchPage(stateUpper, null, 0);
      apiDistricts = Array.from(new Set((stateSample.records || []).map((r) => r.District).filter(Boolean)));
      if (apiDistricts.length > 0) {
        stateDistrictsCache.set(stateUpper, apiDistricts);
      }
    } catch (e) {
      // Continue to fallback
    }
  }

  if (apiDistricts && apiDistricts.length > 0) {
    const normInput = normalizeDistrictName(inputDistrict);
    for (const ad of apiDistricts) {
      const normAd = normalizeDistrictName(ad);
      if (normInput === normAd || normAd.includes(normInput) || normInput.includes(normAd)) {
        const matchPage = await fetchPage(stateUpper, ad, 0);
        if (matchPage && matchPage.total > 0) {
          return { apiDistrict: ad, firstPage: matchPage };
        }
      }
    }
  }

  // Fallback to uppercase
  const fallbackPage = await fetchPage(stateUpper, inputDistrict.toUpperCase(), 0);
  return { apiDistrict: inputDistrict.toUpperCase(), firstPage: fallbackPage };
}

/**
 * Fetch all enterprises for a state+district from the MSME API,
 * using MongoDB cache or paginating through ALL available records without any 10k limit.
 */
async function fetchDistrictEnterprises(state, district) {
  const db = await connectDB();
  const cacheCol = db.collection('msme_district_cache');
  const enterprisesCol = db.collection('msme_enterprises');

  // Check persistent cache summary (valid for 24 hours)
  const cachedSummary = await cacheCol.findOne({
    state: { $regex: '^' + state + '$', $options: 'i' },
    district: { $regex: '^' + district + '$', $options: 'i' },
  });

  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (
    cachedSummary &&
    cachedSummary.cached_at &&
    Date.now() - new Date(cachedSummary.cached_at).getTime() < ONE_DAY &&
    cachedSummary.fetched >= (cachedSummary.total || 0) &&
    cachedSummary.total > 0
  ) {
    const apiDist = cachedSummary.api_district || district;
    const records = await enterprisesCol
      .find(
        { district: apiDist },
        { projection: { _id: 0, state: 0, district: 0, cached_at: 0 } }
      )
      .toArray();

    if (records.length >= cachedSummary.total) {
      return {
        records,
        total: cachedSummary.total,
        fetched: records.length,
        apiDistrict: apiDist,
        cached: true,
      };
    }
  }

  // Auto-resolve district name and get page 0 (10,000 records)
  const { apiDistrict, firstPage } = await resolveApiDistrict(state, district);
  const total = parseInt(firstPage.total, 10) || 0;
  const allRecords = [...(firstPage.records || [])];

  const numPages = Math.ceil(total / PAGE_SIZE);

  for (let page = 1; page < numPages; page++) {
    const result = await fetchPage(state.toUpperCase(), apiDistrict, page * PAGE_SIZE);
    if (result.records && result.records.length > 0) {
      allRecords.push(...result.records);
    }
  }

  // Persist into MongoDB msme_enterprises collection
  try {
    await enterprisesCol.createIndex({ district: 1 });
    await enterprisesCol.deleteMany({ district: apiDistrict });

    const BATCH_SIZE = 10000;
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = allRecords.slice(i, i + BATCH_SIZE).map((r) => ({
        ...r,
        state: state.toUpperCase(),
        district: apiDistrict,
        cached_at: new Date(),
      }));
      await enterprisesCol.insertMany(batch, { ordered: false });
    }

    // Update summary in msme_district_cache
    await cacheCol.updateOne(
      { state, district },
      {
        $set: {
          state,
          district,
          api_district: apiDistrict,
          total,
          fetched: allRecords.length,
          cached_at: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[msmeClient] Failed to cache district enterprises:', err.message);
  }

  return {
    records: allRecords,
    total,
    fetched: allRecords.length,
    apiDistrict,
    cached: false,
  };
}

/**
 * Call Nominatim with User-Agent and retry.
 */
async function queryNominatim(queryStr) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=1`;
  try {
    const res = await httpsGetJson(url);
    if (res.data && res.data.length > 0) {
      return {
        lat: parseFloat(res.data[0].lat),
        lon: parseFloat(res.data[0].lon),
      };
    }
  } catch (err) {
    console.warn('[Nominatim] query failed for:', queryStr, err.message);
  }
  return null;
}

/**
 * Resolve enterprise geographic coordinates using CommunicationAddress or Pincode.
 * Cached in memory and MongoDB `geocache` collection.
 */
async function resolveEnterpriseLocation(rec, district, state) {
  const pin = normalizePin(rec.Pincode);
  const addr = (rec.CommunicationAddress || '').trim();

  // Try address key if address has meaningful length
  const cleanAddr = addr.replace(/[,\s-]+/g, ' ').trim();
  const addressKey = cleanAddr.length >= 10 ? `addr:${cleanAddr.toLowerCase()}:${district.toLowerCase()}` : null;
  const pinKey = pin ? `pin:${pin}:${district.toLowerCase()}` : null;

  // 1. Check in-memory cache for address
  if (addressKey && memoryGeoCache.has(addressKey)) {
    const memAddr = memoryGeoCache.get(addressKey);
    if (memAddr && memAddr.resolved && memAddr.lat != null) return memAddr;
  }

  // 2. Check in-memory cache for pincode
  if (pinKey && memoryGeoCache.has(pinKey)) {
    const memPin = memoryGeoCache.get(pinKey);
    if (memPin && memPin.resolved && memPin.lat != null) return memPin;
  }

  // 3. Check MongoDB geocache
  const db = await connectDB();
  const geoCol = db.collection('geocache');

  if (addressKey) {
    const cachedAddr = await geoCol.findOne({ key: addressKey });
    if (cachedAddr) {
      const result = {
        lat: cachedAddr.lat,
        lon: cachedAddr.lon,
        coordinates_source: cachedAddr.coordinates_source,
        coordinate_accuracy: cachedAddr.coordinate_accuracy,
        resolved: cachedAddr.resolved,
      };
      memoryGeoCache.set(addressKey, result);
      if (result.resolved && result.lat != null) return result;
    }
  }

  if (pinKey) {
    const cachedPin = await geoCol.findOne({ key: pinKey });
    if (cachedPin) {
      const result = {
        lat: cachedPin.lat,
        lon: cachedPin.lon,
        coordinates_source: cachedPin.coordinates_source,
        coordinate_accuracy: cachedPin.coordinate_accuracy,
        resolved: cachedPin.resolved,
      };
      memoryGeoCache.set(pinKey, result);
      if (result.resolved && result.lat != null) return result;
    }
  }

  // 4. Geocode via Nominatim only if neither address nor pincode is cached
  // Preferred order:
  // Step A: Address geocode if address is detailed
  if (cleanAddr.length >= 15) {
    await new Promise((r) => setTimeout(r, 300));
    const coords = await queryNominatim(`${cleanAddr}, ${district}, ${state}, India`);
    if (coords && !isNaN(coords.lat) && !isNaN(coords.lon)) {
      const result = {
        lat: coords.lat,
        lon: coords.lon,
        coordinates_source: 'nominatim_address',
        coordinate_accuracy: 'address',
        resolved: true,
      };
      memoryGeoCache.set(addressKey, result);
      await geoCol.updateOne(
        { key: addressKey },
        { $set: { ...result, key: addressKey, resolved_at: new Date() } },
        { upsert: true }
      );
      return result;
    } else if (addressKey) {
      // Cache failed address attempt so we don't repeat
      await geoCol.updateOne(
        { key: addressKey },
        { $set: { key: addressKey, resolved: false, lat: null, lon: null, resolved_at: new Date() } },
        { upsert: true }
      );
    }
  }

  // Step B: Pincode geocode fallback
  if (pin) {
    await new Promise((r) => setTimeout(r, 300));
    const coords = await queryNominatim(`${pin}, ${district}, ${state}, India`);
    if (coords && !isNaN(coords.lat) && !isNaN(coords.lon)) {
      const result = {
        lat: coords.lat,
        lon: coords.lon,
        coordinates_source: 'nominatim_pincode',
        coordinate_accuracy: 'pincode_approximate',
        resolved: true,
      };
      memoryGeoCache.set(pinKey, result);
      await geoCol.updateOne(
        { key: pinKey },
        { $set: { ...result, key: pinKey, resolved_at: new Date() } },
        { upsert: true }
      );
      return result;
    } else {
      const failed = {
        lat: null,
        lon: null,
        coordinates_source: 'none',
        coordinate_accuracy: 'unresolved',
        resolved: false,
      };
      memoryGeoCache.set(pinKey, failed);
      await geoCol.updateOne(
        { key: pinKey },
        { $set: { ...failed, key: pinKey, resolved_at: new Date() } },
        { upsert: true }
      );
      return failed;
    }
  }

  return {
    lat: null,
    lon: null,
    coordinates_source: 'none',
    coordinate_accuracy: 'unresolved',
    resolved: false,
  };
}

/**
 * Geolocation fallback for villages outside 12-state dataset.
 */
async function resolveVillageLocation(villageName, districtName, stateName) {
  const key = `vill:${villageName.toLowerCase()}:${districtName.toLowerCase()}:${stateName.toLowerCase()}`;
  if (memoryGeoCache.has(key)) return memoryGeoCache.get(key);

  const db = await connectDB();
  const geoCol = db.collection('geocache');
  const cached = await geoCol.findOne({ key });
  if (cached) {
    const res = { lat: cached.lat, lon: cached.lon, resolved: cached.resolved };
    memoryGeoCache.set(key, res);
    return res;
  }

  const coords = await queryNominatim(`${villageName}, ${districtName}, ${stateName}, India`);
  const res = coords
    ? { lat: coords.lat, lon: coords.lon, resolved: true }
    : { lat: null, lon: null, resolved: false };

  memoryGeoCache.set(key, res);
  await geoCol.updateOne(
    { key },
    { $set: { ...res, key, coordinates_source: 'nominatim_village_fallback', resolved_at: new Date() } },
    { upsert: true }
  );
  return res;
}

/**
 * Pre-populates the in-memory geocache with existing MongoDB geocache entries
 * for a district so that location lookups for thousands of records are instantaneous.
 */
async function prepopulateDistrictGeocache(district) {
  const db = await connectDB();
  const geoCol = db.collection('geocache');
  const cachedList = await geoCol
    .find({ key: new RegExp(':' + district.toLowerCase() + '$') })
    .toArray();
  for (const g of cachedList) {
    memoryGeoCache.set(g.key, {
      lat: g.lat,
      lon: g.lon,
      coordinates_source: g.coordinates_source,
      coordinate_accuracy: g.coordinate_accuracy,
      resolved: g.resolved,
    });
  }
  return cachedList.length;
}

module.exports = {
  fetchDistrictEnterprises,
  resolveEnterpriseLocation,
  resolveVillageLocation,
  prepopulateDistrictGeocache,
  normalizePin,
  parseActivities,
  distKm,
};
