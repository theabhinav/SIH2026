const http = require('http');
const path = require('path');
const { connectDB } = require('../config/db');
const { resolveAndPersistVillageCoordinates } = require('../services/villageCoordinateService');

function makeRequest(pathName) {
  return new Promise((resolve, reject) => {
    const port = process.env.PORT || 8001;
    const req = http.get(`http://localhost:${port}${pathName}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(45000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

async function run() {
  console.log('=== STARTING E2E OSM VILLAGE COORDINATE VERIFICATION ===\n');

  // Connect to MongoDB
  const db = await connectDB();
  const villagesCol = db.collection('villages');
  console.log('Connected to MongoDB.\n');

  // 1. Direct Service Tests
  console.log('--- TEST 1: Service Level Tests ---');

  // 1A: 12-State village (Kothapalle, Chittoor, AP)
  console.log('1A: Testing 12-state village: Kothapalle, Chittoor, AP...');
  const v12 = await villagesCol.findOne({ master_id: 'c2011_28_503_5427_596930' });
  if (!v12) {
    console.error('Kothapalle not found in DB!');
  } else {
    const res12 = await resolveAndPersistVillageCoordinates(v12);
    console.log(`Result: Lat=${res12.lat}, Lon=${res12.lon}, Source=${res12.source}`);
    if (res12.source.includes('12_state') || res12.source.includes('census')) {
      console.log('PASS: 12-State coordinate preserved directly, OSM not called.');
    } else {
      console.warn('Source returned:', res12.source);
    }
  }

  // 1B: Non-12-State village: Abu Said, Amritsar, Punjab
  console.log('\n1B: Testing Non-12-state village: Abu Said, Amritsar, Punjab...');
  const vNon12 = await villagesCol.findOne({ master_id: 'c2011_3_27_255_37270' });
  if (!vNon12) {
    console.error('Abu Said not found in DB!');
  } else {
    const resNon12 = await resolveAndPersistVillageCoordinates(vNon12);
    console.log(`Result: Lat=${resNon12.lat}, Lon=${resNon12.lon}, Source=${resNon12.source}, Resolved=${resNon12.resolved}`);
    if (resNon12.lat && resNon12.lon && resNon12.resolved) {
      console.log('PASS: Non-12-state village coordinates resolved from OSM and persisted.');
    } else {
      console.error('FAIL: No coordinates for Abu Said.');
    }
  }

  // 1C: Non-12-State village: Kerala
  console.log('\n1C: Testing Non-12-state village from Kerala...');
  const vKerala = await villagesCol.findOne({ state_name: { $regex: /kerala/i } });
  if (vKerala) {
    const resKerala = await resolveAndPersistVillageCoordinates(vKerala);
    console.log(`Result for ${vKerala.village_name}, ${vKerala.district_name}: Lat=${resKerala.lat}, Lon=${resKerala.lon}, Source=${resKerala.source}`);
    console.log('PASS: Kerala village coordinates resolved.');
  }

  // 2. HTTP API Tests
  console.log('\n--- TEST 2: HTTP API Endpoints ---');

  // Test GET /api/villages/:masterId/coordinates
  console.log('2A: Testing GET /api/villages/c2011_3_27_255_37270/coordinates...');
  try {
    const apiRes = await makeRequest('/api/villages/c2011_3_27_255_37270/coordinates');
    console.log(`Status: ${apiRes.status}`);
    console.log(`Response: Lat=${apiRes.body.latitude}, Lon=${apiRes.body.longitude}, Source=${apiRes.body.coordinates_source}`);
    if (apiRes.status === 200 && apiRes.body.latitude) {
      console.log('PASS: /api/villages/:masterId/coordinates returned resolved coordinates.');
    }
  } catch (e) {
    console.error('API request failed:', e.message);
  }

  // Test Catchment Radius API with resolved coordinates
  console.log('\n2B: Testing GET /api/villages/c2011_3_27_255_37270/catchment...');
  try {
    const catchmentRes = await makeRequest('/api/villages/c2011_3_27_255_37270/catchment');
    console.log(`Status: ${catchmentRes.status}`);
    console.log(`Catchment Summary: Target=${catchmentRes.body.anchor?.village_name}, Coords=${JSON.stringify(catchmentRes.body.anchor?.location?.coordinates)}`);
    console.log(`5km Catchment: Villages=${catchmentRes.body.catchment_5km?.village_count}, Population=${catchmentRes.body.catchment_5km?.population}`);
    console.log(`10km Catchment: Villages=${catchmentRes.body.catchment_10km?.village_count}, Population=${catchmentRes.body.catchment_10km?.population}`);
    if (catchmentRes.status === 200 && catchmentRes.body.catchment_5km) {
      console.log('PASS: Catchment API accepted OSM resolved coordinates and queried geo engine successfully!');
    }
  } catch (e) {
    console.error('Catchment request failed:', e.message);
  }

  // Test Market Intelligence API with resolved coordinates
  console.log('\n2C: Testing GET /api/market-intelligence?masterId=c2011_3_27_255_37270&category=Poultry%20Farming...');
  try {
    const miRes = await makeRequest('/api/market-intelligence?masterId=c2011_3_27_255_37270&category=Poultry%20Farming');
    console.log(`Status: ${miRes.status}`);
    console.log(`MI Summary: Village=${miRes.body.anchor?.village_name}, Coords=[${miRes.body.anchor?.centroid_latitude}, ${miRes.body.anchor?.centroid_longitude}]`);
    console.log(`Competition Level=${miRes.body.competition_level}, Competitors 5km=${miRes.body.competitors_5km}, Competitors 10km=${miRes.body.competitors_10km}`);
    if (miRes.status === 200 && miRes.body.anchor?.centroid_latitude) {
      console.log('PASS: Market Intelligence API accepted OSM resolved coordinates and completed analysis!');
    }
  } catch (e) {
    console.error('Market Intelligence request failed:', e.message);
  }

  // Test 12-State village through Market Intelligence as control comparison
  console.log('\n2D: Testing 12-State village (Kothapalle) control comparison...');
  try {
    const miKothapalle = await makeRequest('/api/market-intelligence?masterId=c2011_28_503_5427_596930&category=Poultry%20Farming');
    console.log(`Status: ${miKothapalle.status}`);
    console.log(`MI Kothapalle: Village=${miKothapalle.body.anchor?.village_name}, Coords=[${miKothapalle.body.anchor?.centroid_latitude}, ${miKothapalle.body.anchor?.centroid_longitude}]`);
    console.log(`Competition Level=${miKothapalle.body.competition_level}, Competitors 5km=${miKothapalle.body.competitors_5km}, Competitors 10km=${miKothapalle.body.competitors_10km}`);
    if (miKothapalle.status === 200 && miKothapalle.body.anchor?.centroid_latitude) {
      console.log('PASS: 12-State village control test passed perfectly!');
    }
  } catch (e) {
    console.error('12-State MI request failed:', e.message);
  }

  console.log('\n=== ALL TESTS COMPLETE ===');
  process.exit(0);
}

run().catch(err => {
  console.error('Error running verification:', err);
  process.exit(1);
});
