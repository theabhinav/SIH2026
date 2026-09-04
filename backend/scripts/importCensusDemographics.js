const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { connectDB } = require('../config/db');

const jsonlPath = process.argv[2] || 'C:/Users/Narayan Kumar/Downloads/census_pca_villages.jsonl';

async function importDemographics() {
  if (!fs.existsSync(jsonlPath)) {
    console.error('[-] Error: File not found:', jsonlPath);
    process.exit(1);
  }

  console.log('==================================================');
  console.log('🚀 Importing Census 2011 Demographics to MongoDB');
  console.log('📄 Source:', jsonlPath);
  console.log('==================================================');

  const t0 = Date.now();
  const db = await connectDB();
  const col = db.collection('villages');

  console.log('Ensuring index on census_2011_code...');
  await col.createIndex({ census_2011_code: 1 }, { name: 'idx_census_2011_code' });
  console.log('✅ Index verified.');

  const rl = readline.createInterface({
    input: fs.createReadStream(jsonlPath),
    crlfDelay: Infinity
  });

  const BATCH_SIZE = 5000;
  let batchOps = [];
  let totalRead = 0;
  let totalModified = 0;
  let totalMatched = 0;

  async function flush() {
    if (batchOps.length === 0) return;
    try {
      const res = await col.bulkWrite(batchOps, { ordered: false });
      totalModified += (res.modifiedCount || 0);
      totalMatched += (res.matchedCount || 0);
    } catch (err) {
      if (err.result) {
        totalModified += (err.result.nModified || 0);
        totalMatched += (err.result.nMatched || 0);
      } else {
        console.error('[-] Batch error:', err.message);
      }
    }
    batchOps = [];
  }

  for await (const line of rl) {
    if (!line || !line.trim()) continue;
    totalRead++;
    const item = JSON.parse(line);

    if (!item.code) continue;
    const rawCode = String(item.code).trim();
    const strippedCode = String(parseInt(rawCode, 10));
    const codes = rawCode === strippedCode ? [rawCode] : [rawCode, strippedCode];

    batchOps.push({
      updateMany: {
        filter: {
          census_2011_code: { $in: codes }
        },
        update: {
          $set: {
            census_2011_no_hh: item.hh,
            census_2011_tot_p: item.tot_p,
            census_2011_tot_m: item.tot_m,
            census_2011_tot_f: item.tot_f,
            census_2011_p_sc: item.p_sc,
            census_2011_p_st: item.p_st,
            census_2011_p_lit: item.p_lit,
            census_2011_tot_work_p: item.work_p,
            census_2011_mainwork_p: item.main_p,
            census_2011_margwork_p: item.marg_p,
            demographic_match_status: 'matched',
            demographics_source: 'Census_2011_PCA'
          }
        }
      }
    });

    if (batchOps.length >= BATCH_SIZE) {
      await flush();
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      process.stdout.write(`\rProgress: ${totalRead.toLocaleString()} read | ${totalMatched.toLocaleString()} matched | ${totalModified.toLocaleString()} updated (${elapsed}s)...`);
    }
  }

  await flush();
  const duration = ((Date.now() - t0) / 1000).toFixed(2);
  console.log('\n==================================================');
  console.log('✅ Census 2011 Demographics Import Completed');
  console.log(`📊 Total Lines Read:     ${totalRead.toLocaleString()}`);
  console.log(`📊 Documents Matched:    ${totalMatched.toLocaleString()}`);
  console.log(`📊 Documents Updated:    ${totalModified.toLocaleString()}`);
  console.log(`⏱️ Duration:             ${duration}s`);
  console.log('==================================================');

  // Verify Kothapalle
  const kDoc = await col.findOne({ master_id: 'c2011_28_503_5427_596930' });
  console.log('\n🔍 Verification: Kothapalle Demographics in MongoDB:');
  console.log({
    village_name: kDoc?.village_name,
    census_2011_code: kDoc?.census_2011_code,
    census_2011_tot_p: kDoc?.census_2011_tot_p,
    census_2011_no_hh: kDoc?.census_2011_no_hh,
    census_2011_tot_m: kDoc?.census_2011_tot_m,
    census_2011_tot_f: kDoc?.census_2011_tot_f,
    census_2011_p_sc: kDoc?.census_2011_p_sc,
    census_2011_p_st: kDoc?.census_2011_p_st,
    census_2011_p_lit: kDoc?.census_2011_p_lit,
    census_2011_tot_work_p: kDoc?.census_2011_tot_work_p,
    demographic_match_status: kDoc?.demographic_match_status
  });

  process.exit(0);
}

importDemographics().catch(err => {
  console.error('[-] Fatal error:', err);
  process.exit(1);
});
