const path = require('path');
const backendDir = 'C:/Users/Narayan Kumar/OneDrive/Desktop/SIH2026/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { connectDB } = require(path.join(backendDir, 'config/db'));

async function testPipeline() {
  console.log('==================================================');
  console.log('🧪 Testing Market Intelligence Pipeline');
  console.log('==================================================\n');

  const BASE_URL = 'http://localhost:8001';
  const masterId = 'c2011_28_503_5427_596930'; // Kothapalle

  // Categories to test (Poultry Farming + at least 2 other categories from businessData.js)
  const categories = [
    'Poultry Farming',
    'Dairy & Milk Products',
    'Retail Kirana Store',
    'Bakery & Confectionery'
  ];

  for (const cat of categories) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Testing category: "${cat}" for Kothapalle...`);
    console.log(`--------------------------------------------------`);

    const t0 = Date.now();
    const url = `${BASE_URL}/api/market-intelligence?masterId=${masterId}&category=${encodeURIComponent(cat)}`;
    const res = await fetch(url);
    const data = await res.json();
    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

    if (res.status !== 200) {
      console.error(`❌ Request failed (${res.status}):`, data);
      continue;
    }

    console.log(`✅ Success in ${elapsed}s`);
    console.log(`   Anchor:`, `${data.anchor?.village_name} (${data.anchor?.district_name}, ${data.anchor?.state_name}) [${data.anchor?.location?.coordinates}]`);
    console.log(`   MSME Summary:`);
    console.log(`     District:             ${data.msme_summary?.district} (API: ${data.msme_summary?.api_district})`);
    console.log(`     Total in District:    ${data.msme_summary?.total_in_district?.toLocaleString('en-IN')}`);
    console.log(`     Fetched / Analyzed:   ${data.msme_summary?.fetched_for_analysis?.toLocaleString('en-IN')}`);
    console.log(`     Matched Category:     ${data.msme_summary?.matched_category?.toLocaleString('en-IN')}`);
    console.log(`     Usable Coordinates:   ${data.msme_summary?.with_usable_coordinates?.toLocaleString('en-IN')}`);
    console.log(`     Unresolved Locations: ${data.msme_summary?.unresolved_locations?.toLocaleString('en-IN')}`);
    console.log(`   Radius Competitors:`);
    console.log(`     Within 5 km:          ${data.competitors_5km}`);
    console.log(`     Within 10 km:         ${data.competitors_10km}`);
    console.log(`     Competition Level:    ${data.competition_level}`);
    console.log(`     Enterprises on Map:   ${data.enterprises?.length}`);
    if (data.enterprises?.length > 0) {
      console.log(`     Sample Map Enterprise: ${data.enterprises[0].name} (${data.enterprises[0].dist_km} km away, PIN: ${data.enterprises[0].pincode}, Coords: [${data.enterprises[0].lat}, ${data.enterprises[0].lon}])`);
    }
    console.log(`   Geographic Catchment 5 km:`);
    console.log(`     Villages:             ${data.catchment_5km?.village_count}`);
    console.log(`     Population:           ${data.catchment_5km?.population?.toLocaleString('en-IN')}`);
    console.log(`     Households:           ${data.catchment_5km?.households?.toLocaleString('en-IN')}`);
    console.log(`     Workers:              ${data.catchment_5km?.workers?.toLocaleString('en-IN')}`);
    console.log(`     Male:                 ${data.catchment_5km?.male?.toLocaleString('en-IN')}`);
    console.log(`     Female:               ${data.catchment_5km?.female?.toLocaleString('en-IN')}`);
    console.log(`     Literate:             ${data.catchment_5km?.literate?.toLocaleString('en-IN')}`);
    console.log(`     SC Population:        ${data.catchment_5km?.sc?.toLocaleString('en-IN')}`);
    console.log(`     ST Population:        ${data.catchment_5km?.st?.toLocaleString('en-IN')}`);
    console.log(`   Geographic Catchment 10 km:`);
    console.log(`     Villages:             ${data.catchment_10km?.village_count}`);
    console.log(`     Population:           ${data.catchment_10km?.population?.toLocaleString('en-IN')}`);
    console.log(`     Households:           ${data.catchment_10km?.households?.toLocaleString('en-IN')}`);
    console.log(`     Workers:              ${data.catchment_10km?.workers?.toLocaleString('en-IN')}`);
  }

  process.exit(0);
}

testPipeline().catch(console.error);
