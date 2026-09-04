const { connectDB } = require('../config/db');

const EARTH_RADIUS_KM = 6378.1;

function geoFilter(lon, lat, radiusKm) {
  return {
    location: {
      $geoWithin: {
        $centerSphere: [[lon, lat], radiusKm / EARTH_RADIUS_KM],
      },
    },
  };
}

async function verify() {
  const db = await connectDB();
  const col = db.collection('villages');

  console.log('=== 1. DATABASE OVERVIEW ===');
  const totalVillages = await col.countDocuments();
  const withCode = await col.countDocuments({ census_2011_code: { $exists: true, $ne: null } });
  const withDemographics = await col.countDocuments({ census_2011_tot_p: { $exists: true, $ne: null } });
  const withCoords = await col.countDocuments({ centroid_latitude: { $exists: true, $ne: null } });
  
  console.log(`Total village documents in MongoDB: ${totalVillages.toLocaleString()}`);
  console.log(`Villages with census_2011_code:       ${withCode.toLocaleString()}`);
  console.log(`Villages with census_2011_tot_p:      ${withDemographics.toLocaleString()}`);
  console.log(`Villages with centroid coordinates:    ${withCoords.toLocaleString()}`);

  console.log('\n=== 2. KOTHAPALLE ANCHOR DETAILS ===');
  const anchor = await col.findOne({ master_id: 'c2011_28_503_5427_596930' });
  if (!anchor) {
    console.error('Kothapalle not found!');
    process.exit(1);
  }
  console.log({
    master_id: anchor.master_id,
    village_name: anchor.village_name,
    block_name: anchor.block_name,
    district_name: anchor.district_name,
    state_name: anchor.state_name,
    census_2011_code: anchor.census_2011_code,
    centroid_latitude: anchor.centroid_latitude,
    centroid_longitude: anchor.centroid_longitude,
    demographics: {
      tot_p: anchor.census_2011_tot_p,
      no_hh: anchor.census_2011_no_hh,
      tot_m: anchor.census_2011_tot_m,
      tot_f: anchor.census_2011_tot_f,
      p_lit: anchor.census_2011_p_lit,
      p_sc: anchor.census_2011_p_sc,
      p_st: anchor.census_2011_p_st,
      tot_work_p: anchor.census_2011_tot_work_p
    }
  });

  const [anchorLon, anchorLat] = [anchor.centroid_longitude, anchor.centroid_latitude];

  // 3. 5 KM Catchment
  console.log('\n=== 3. 5 KM CATCHMENT AUDIT ===');
  const villages5km = await col.find(geoFilter(anchorLon, anchorLat, 5)).toArray();
  console.log(`Found ${villages5km.length} villages within 5 km.`);

  // Check if Kothapalle is included
  const kothapalleIn5 = villages5km.some(v => v.master_id === anchor.master_id);
  console.log(`Is Kothapalle itself in the 5 km catchment? ${kothapalleIn5}`);

  let sum5 = { pop: 0, hh: 0, male: 0, female: 0, lit: 0, sc: 0, st: 0, workers: 0 };
  let missing5 = [];
  console.log('\n--- 5 KM Individual Village Details ---');
  villages5km.forEach((v, idx) => {
    const p = v.census_2011_tot_p;
    if (p === null || p === undefined) missing5.push(v);
    sum5.pop += (v.census_2011_tot_p || 0);
    sum5.hh += (v.census_2011_no_hh || 0);
    sum5.male += (v.census_2011_tot_m || 0);
    sum5.female += (v.census_2011_tot_f || 0);
    sum5.lit += (v.census_2011_p_lit || 0);
    sum5.sc += (v.census_2011_p_sc || 0);
    sum5.st += (v.census_2011_p_st || 0);
    sum5.workers += (v.census_2011_tot_work_p || 0);

    console.log(`${idx + 1}. [${v.census_2011_code || 'NO_CODE'}] ${v.village_name} (${v.block_name}) | Pop: ${v.census_2011_tot_p} | HH: ${v.census_2011_no_hh} | W: ${v.census_2011_tot_work_p} | M: ${v.census_2011_tot_m} | F: ${v.census_2011_tot_f} | Lit: ${v.census_2011_p_lit} | SC: ${v.census_2011_p_sc} | ST: ${v.census_2011_p_st}`);
  });

  console.log('\n5 KM Independently Calculated Totals:');
  console.log(sum5);
  console.log(`Missing census demographic records in 5 km: ${missing5.length}`);

  // 4. 10 KM Catchment
  console.log('\n=== 4. 10 KM CATCHMENT AUDIT ===');
  const villages10km = await col.find(geoFilter(anchorLon, anchorLat, 10)).toArray();
  console.log(`Found ${villages10km.length} villages within 10 km.`);

  const kothapalleIn10 = villages10km.some(v => v.master_id === anchor.master_id);
  console.log(`Is Kothapalle itself in the 10 km catchment? ${kothapalleIn10}`);

  let sum10 = { pop: 0, hh: 0, male: 0, female: 0, lit: 0, sc: 0, st: 0, workers: 0 };
  let missing10 = [];
  console.log('\n--- 10 KM Individual Village Details ---');
  villages10km.forEach((v, idx) => {
    const p = v.census_2011_tot_p;
    if (p === null || p === undefined) missing10.push(v);
    sum10.pop += (v.census_2011_tot_p || 0);
    sum10.hh += (v.census_2011_no_hh || 0);
    sum10.male += (v.census_2011_tot_m || 0);
    sum10.female += (v.census_2011_tot_f || 0);
    sum10.lit += (v.census_2011_p_lit || 0);
    sum10.sc += (v.census_2011_p_sc || 0);
    sum10.st += (v.census_2011_p_st || 0);
    sum10.workers += (v.census_2011_tot_work_p || 0);

    console.log(`${idx + 1}. [${v.census_2011_code || 'NO_CODE'}] ${v.village_name} (${v.block_name}) | Pop: ${v.census_2011_tot_p} | HH: ${v.census_2011_no_hh} | W: ${v.census_2011_tot_work_p} | M: ${v.census_2011_tot_m} | F: ${v.census_2011_tot_f} | Lit: ${v.census_2011_p_lit} | SC: ${v.census_2011_p_sc} | ST: ${v.census_2011_p_st}`);
  });

  console.log('\n10 KM Independently Calculated Totals:');
  console.log(sum10);
  console.log(`Missing census demographic records in 10 km: ${missing10.length}`);

  // Check for duplicate census codes or master_ids
  const codes5 = villages5km.map(v => v.census_2011_code).filter(Boolean);
  const dupCodes5 = codes5.filter((item, index) => codes5.indexOf(item) !== index);
  console.log(`Duplicate Census codes in 5 km: ${dupCodes5.length > 0 ? dupCodes5 : 'None'}`);

  const codes10 = villages10km.map(v => v.census_2011_code).filter(Boolean);
  const dupCodes10 = codes10.filter((item, index) => codes10.indexOf(item) !== index);
  console.log(`Duplicate Census codes in 10 km: ${dupCodes10.length > 0 ? dupCodes10 : 'None'}`);

  process.exit(0);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
