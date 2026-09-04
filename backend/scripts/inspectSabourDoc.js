const { connectDB } = require('../config/db');

async function check() {
  const db = await connectDB();
  const doc = await db.collection('villages').findOne({ master_id: 'c2011_10_192_1338_239423' });
  console.log('MongoDB doc:', doc);
  process.exit(0);
}

check().catch(console.error);
