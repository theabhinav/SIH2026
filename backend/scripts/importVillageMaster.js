const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { connectDB } = require('../config/db');

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

const NUMERIC_COLS = new Set([
  'latitude',
  'longitude',
  'census_2011_no_hh',
  'census_2011_tot_p',
  'census_2011_tot_m',
  'census_2011_tot_f',
  'census_2011_p_06',
  'census_2011_p_sc',
  'census_2011_p_st',
  'census_2011_p_lit',
  'census_2011_p_ill',
  'census_2011_tot_work_p',
  'census_2011_mainwork_p',
  'census_2011_margwork_p',
  'census_2011_non_work_p'
]);

async function runImport() {
  const args = process.argv.slice(2);
  const csvArg = args[0] || path.resolve('C:/Users/Narayan Kumar/Downloads/village_master.csv');

  if (!fs.existsSync(csvArg)) {
    console.error('❌ CSV file not found at:', csvArg);
    process.exit(1);
  }

  console.log('==================================================');
  console.log('🚀 Starting Village Master Import');
  console.log('📄 Source CSV:', csvArg);
  console.log('==================================================');

  const startTime = Date.now();
  const db = await connectDB();
  const collection = db.collection('villages');

  console.log('⚙️ Ensuring indexes on "villages" collection...');
  await collection.createIndex({ master_id: 1 }, { unique: true, name: 'idx_master_id_unique' });
  await collection.createIndex({ location: '2dsphere' }, { name: 'idx_location_2dsphere' });
  await collection.createIndex({ village_name: 1 }, { name: 'idx_village_name' });
  await collection.createIndex({ village_name_normalized: 1 }, { name: 'idx_village_name_norm' });
  await collection.createIndex({
    state_code: 1,
    district_code: 1,
    block_code: 1,
    village_census_code: 1
  }, { name: 'idx_admin_hierarchy' });
  await collection.createIndex({ village_code_2011: 1 }, { name: 'idx_village_code_2011' });
  await collection.createIndex({ census_2011_code: 1 }, { name: 'idx_census_2011_code' });
  console.log('✅ Indexes verified successfully.');

  const rl = readline.createInterface({
    input: fs.createReadStream(csvArg),
    crlfDelay: Infinity
  });

  let totalRowsRead = 0;
  let header = null;
  let successfullyProcessed = 0;
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedMalformed = 0;
  let duplicateRecords = 0;
  let withGeoJSON = 0;

  const BATCH_SIZE = 5000;
  let batchOps = [];

  const seenInRun = new Set();

  async function flushBatch() {
    if (batchOps.length === 0) return;
    try {
      const res = await collection.bulkWrite(batchOps, { ordered: false });
      insertedCount += (res.upsertedCount || 0);
      updatedCount += (res.modifiedCount || 0);
    } catch (err) {
      if (err.result) {
        insertedCount += (err.result.nUpserted || 0);
        updatedCount += (err.result.nModified || 0);
      } else {
        console.error('❌ Batch bulkWrite error:', err.message);
      }
    }
    batchOps = [];
  }

  for await (const line of rl) {
    totalRowsRead++;
    if (totalRowsRead === 1) {
      header = parseCSVLine(line.replace(/^\uFEFF/, ''));
      continue;
    }

    if (!line || !line.trim()) {
      skippedMalformed++;
      continue;
    }

    const fields = parseCSVLine(line);
    if (fields.length !== header.length) {
      skippedMalformed++;
      continue;
    }

    const doc = {};
    for (let i = 0; i < header.length; i++) {
      const key = header[i];
      let val = fields[i].trim();

      if (NUMERIC_COLS.has(key)) {
        if (val === '') {
          doc[key] = null;
        } else {
          const num = Number(val);
          doc[key] = isNaN(num) ? val : num;
        }
      } else {
        doc[key] = val;
      }
    }

    const masterId = doc.master_id;
    if (!masterId) {
      skippedMalformed++;
      continue;
    }

    if (seenInRun.has(masterId)) {
      duplicateRecords++;
      continue;
    }
    seenInRun.add(masterId);

    // Administrative compatibility mappings without dropping any original columns
    doc.village_census_code = doc.village_code_2011 || doc.census_2011_code || doc.source_village_census_code || '';
    doc.panchayat_name = doc.source_panchayat_name || doc.local_body_name || '';
    doc.panchayat_code = doc.source_panchayat_code || doc.local_body_code || '';
    doc.block_name = doc.source_block_name || doc.sub_district_name || '';
    doc.block_code = doc.source_block_code || doc.sub_district_census_code_2011 || '';
    doc.district_code = doc.source_district_code || doc.district_census_code_2011 || '';
    doc.district_census_code = doc.district_census_code_2011 || doc.source_district_census_code || '';
    doc.state_code = doc.source_state_code || doc.state_census_code_2011 || '';
    doc.state_census_code = doc.state_census_code_2011 || doc.source_state_census_code || '';
    doc.village_descriptive_name = doc.source_village_descriptive_name || doc.village_name || '';

    // Normalized search field
    const vName = doc.village_name || '';
    doc.village_name_normalized = vName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Centroid aliases
    doc.centroid_latitude = doc.latitude != null ? doc.latitude : null;
    doc.centroid_longitude = doc.longitude != null ? doc.longitude : null;

    // GeoJSON Point: [longitude, latitude]
    const lat = doc.latitude;
    const lon = doc.longitude;
    if (typeof lat === 'number' && typeof lon === 'number' &&
        lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      doc.location = {
        type: 'Point',
        coordinates: [lon, lat]
      };
      withGeoJSON++;
    } else {
      doc.location = null;
    }

    doc.imported_at = new Date();

    batchOps.push({
      updateOne: {
        filter: { master_id: masterId },
        update: { $set: doc },
        upsert: true
      }
    });

    successfullyProcessed++;

    if (batchOps.length >= BATCH_SIZE) {
      await flushBatch();
      const pct = ((totalRowsRead / 644721) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\r⏳ Processed ${successfullyProcessed.toLocaleString()} rows (${pct}%) | GeoJSON: ${withGeoJSON.toLocaleString()} | Elapsed: ${elapsed}s`);
    }
  }

  await flushBatch();
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n==================================================');
  console.log('✅ Village Master Import Completed');
  console.log('==================================================');
  console.log(`📊 Total CSV Rows Read:       ${(totalRowsRead - 1).toLocaleString()}`);
  console.log(`📊 Successfully Processed:    ${successfullyProcessed.toLocaleString()}`);
  console.log(`📊 Inserted Documents:        ${insertedCount.toLocaleString()}`);
  console.log(`📊 Updated Documents:         ${updatedCount.toLocaleString()}`);
  console.log(`📊 Duplicate/Conflicting:     ${duplicateRecords.toLocaleString()}`);
  console.log(`📊 Skipped/Malformed:         ${skippedMalformed.toLocaleString()}`);
  console.log(`📊 With Valid GeoJSON:        ${withGeoJSON.toLocaleString()}`);
  console.log(`⏱️ Total Time Taken:          ${totalDuration} seconds`);
  console.log('==================================================');

  process.exit(0);
}

runImport().catch((err) => {
  console.error('\n❌ Fatal import error:', err);
  process.exit(1);
});
