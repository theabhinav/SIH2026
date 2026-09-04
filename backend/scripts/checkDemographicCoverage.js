const { connectDB } = require('../config/db');

async function check() {
  const db = await connectDB();
  const col = db.collection('villages');
  const total = await col.countDocuments();
  const withP = await col.countDocuments({ census_2011_tot_p: { $exists: true, $ne: null } });
  const matchedStatus = await col.countDocuments({ demographic_match_status: 'matched' });
  const zeroPop = await col.countDocuments({ census_2011_tot_p: 0 });
  const unpopulatedInCensus = await col.countDocuments({ census_2011_tot_p: 0, demographic_match_status: 'matched' });
  
  console.log('--- DEMOGRAPHIC COVERAGE ---');
  console.log(`Total Villages:                      ${total.toLocaleString()}`);
  console.log(`Villages with census_2011_tot_p:     ${withP.toLocaleString()}`);
  console.log(`Matched with Census PCA:             ${matchedStatus.toLocaleString()}`);
  console.log(`Villages with Population = 0:        ${zeroPop.toLocaleString()}`);
  console.log(`Genuine Inhabited/Uninhabited (Pop 0 in Census): ${unpopulatedInCensus.toLocaleString()}`);

  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
