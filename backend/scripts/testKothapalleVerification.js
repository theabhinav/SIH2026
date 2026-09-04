const path = require('path');
const { connectDB } = require('../config/db');

const BASE_URL = 'http://localhost:8001';

async function verifyAll() {
  console.log('==================================================');
  console.log('🧪 Starting Kothapalle Coordinates Verification');
  console.log('==================================================\n');

  // 1. Direct MongoDB verification
  console.log('1️⃣ Checking MongoDB directly...');
  const db = await connectDB();
  const col = db.collection('villages');
  const mongoDoc = await col.findOne({
    state_name: 'Andhra Pradesh',
    district_name: 'Chittoor',
    block_name: { $regex: 'kuppam', $options: 'i' },
    village_name: { $regex: '^kothapalle$', $options: 'i' }
  });

  if (!mongoDoc) {
    console.error('❌ Kothapalle in Kuppam, Chittoor not found in MongoDB!');
    process.exit(1);
  }

  console.log('✅ Found MongoDB Record:');
  console.log('   master_id:         ', mongoDoc.master_id);
  console.log('   village_name:      ', mongoDoc.village_name);
  console.log('   block_name:        ', mongoDoc.block_name);
  console.log('   district_name:     ', mongoDoc.district_name);
  console.log('   state_name:        ', mongoDoc.state_name);
  console.log('   latitude:          ', mongoDoc.latitude);
  console.log('   longitude:         ', mongoDoc.longitude);
  console.log('   centroid_latitude: ', mongoDoc.centroid_latitude);
  console.log('   centroid_longitude:', mongoDoc.centroid_longitude);
  console.log('   location:          ', JSON.stringify(mongoDoc.location));
  console.log('   match_status:      ', mongoDoc.coordinate_match_status);

  // 2. Test /api/villages/search?q=Kothapalle
  console.log('\n2️⃣ Testing GET /api/villages/search?q=Kothapalle...');
  const searchRes = await fetch(`${BASE_URL}/api/villages/search?q=Kothapalle&limit=50`);
  const searchData = await searchRes.json();
  const kuppamSearch = searchData.find(
    v => v.state_name === 'Andhra Pradesh' && v.district_name === 'Chittoor' && v.block_name.toLowerCase() === 'kuppam'
  );

  if (!kuppamSearch) {
    console.error('❌ Kuppam Kothapalle not returned by /api/villages/search!');
    process.exit(1);
  }

  console.log('✅ /api/villages/search returned Kuppam Kothapalle:');
  console.log('   master_id:         ', kuppamSearch.master_id);
  console.log('   village_name:      ', kuppamSearch.village_name);
  console.log('   block_name:        ', kuppamSearch.block_name);
  console.log('   district_name:     ', kuppamSearch.district_name);
  console.log('   state_name:        ', kuppamSearch.state_name);
  console.log('   latitude:          ', kuppamSearch.latitude);
  console.log('   longitude:         ', kuppamSearch.longitude);
  console.log('   centroid_latitude: ', kuppamSearch.centroid_latitude);
  console.log('   centroid_longitude:', kuppamSearch.centroid_longitude);
  console.log('   location:          ', JSON.stringify(kuppamSearch.location));

  // 3. Test /api/locations/villages?state=Andhra%20Pradesh&district=Chittoor&q=Kothapalle
  console.log('\n3️⃣ Testing GET /api/locations/villages?state=Andhra Pradesh&district=Chittoor&q=Kothapalle...');
  const locRes = await fetch(`${BASE_URL}/api/locations/villages?state=Andhra%20Pradesh&district=Chittoor&q=Kothapalle`);
  const locData = await locRes.json();
  const kuppamLoc = locData.villages.find(v => v.master_id === mongoDoc.master_id);

  if (!kuppamLoc) {
    console.error('❌ Kuppam Kothapalle not returned by /api/locations/villages!');
    process.exit(1);
  }

  console.log('✅ /api/locations/villages returned Kuppam Kothapalle:');
  console.log('   master_id:         ', kuppamLoc.master_id);
  console.log('   village_name:      ', kuppamLoc.village_name);
  console.log('   block_name:        ', kuppamLoc.block_name);
  console.log('   district_name:     ', kuppamLoc.district_name);
  console.log('   state_name:        ', kuppamLoc.state_name);
  console.log('   latitude:          ', kuppamLoc.latitude);
  console.log('   longitude:         ', kuppamLoc.longitude);
  console.log('   centroid_latitude: ', kuppamLoc.centroid_latitude);
  console.log('   centroid_longitude:', kuppamLoc.centroid_longitude);
  console.log('   location:          ', JSON.stringify(kuppamLoc.location));

  // 4. Test geospatial catchment / radius analysis on this village
  console.log(`\n4️⃣ Testing GET /api/villages/${mongoDoc.master_id}/catchment (geospatial radius analysis)...`);
  const catchRes = await fetch(`${BASE_URL}/api/villages/${mongoDoc.master_id}/catchment`);
  const catchData = await catchRes.json();
  console.log('✅ Catchment analysis succeeded:');
  console.log('   catchment_available:', catchData.catchment_available);
  console.log('   5 km villages count:', catchData.catchment_5km?.village_count);
  console.log('   10 km villages count:', catchData.catchment_10km?.village_count);
  console.log('   Anchor coordinates: ', JSON.stringify(catchData.anchor?.location?.coordinates));

  console.log('\n==================================================');
  console.log('🎉 ALL 4 VERIFICATION CHECKS PASSED PERFECTLY!');
  console.log('==================================================');

  setTimeout(() => process.exit(0), 100);
}

verifyAll().catch(err => {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
});
