const { connectDB } = require('../config/db');

async function inspect() {
  const db = await connectDB();
  const col = db.collection('villages');
  const resolved = await col.find({
    district_name: { $regex: /bhagalpur/i },
    $or: [
      { coordinates_resolved_at: { $exists: true } },
      { coordinate_match_status: 'osm_resolved' },
      { centroid_latitude: { $ne: null } }
    ]
  }).toArray();

  console.log(`Found ${resolved.length} resolved villages in Bhagalpur:`);
  resolved.forEach(v => {
    console.log({
      master_id: v.master_id,
      village_name: v.village_name,
      block_name: v.block_name,
      census_2011_code: v.census_2011_code,
      census_2011_tot_p: v.census_2011_tot_p,
      census_2011_no_hh: v.census_2011_no_hh,
      demographic_match_status: v.demographic_match_status,
      demographics_source: v.demographics_source,
      centroid_latitude: v.centroid_latitude,
      centroid_longitude: v.centroid_longitude,
      coordinates_source: v.coordinates_source
    });
  });

  process.exit(0);
}

inspect().catch(e => {
  console.error(e);
  process.exit(1);
});
