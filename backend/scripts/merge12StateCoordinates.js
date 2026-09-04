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

function normalizeStr(s) {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runMerge() {
  const csvPath = process.argv[2] || path.resolve('C:/Users/Narayan Kumar/Downloads/all_12_states_villages.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV not found at:', csvPath);
    process.exit(1);
  }

  console.log('==================================================');
  console.log('🚀 Merging 12-State Coordinates into MongoDB');
  console.log('📄 Source:', csvPath);
  console.log('==================================================');

  const startTime = Date.now();
  const db = await connectDB();
  const col = db.collection('villages');

  // Read all CSV records grouped by state
  console.log('📖 Reading all_12_states_villages.csv...');
  const rl = readline.createInterface({
    input: fs.createReadStream(csvPath),
    crlfDelay: Infinity
  });

  let totalRows = 0;
  let header = null;
  const csvByState = {};

  for await (const line of rl) {
    totalRows++;
    if (totalRows === 1) {
      header = parseCSVLine(line.replace(/^\uFEFF/, ''));
      continue;
    }
    if (!line || !line.trim()) continue;

    const fields = parseCSVLine(line);
    if (fields.length !== header.length) continue;

    const row = {};
    for (let i = 0; i < header.length; i++) {
      row[header[i]] = fields[i].trim();
    }

    const sName = row.state_name;
    if (!sName) continue;

    if (!csvByState[sName]) csvByState[sName] = [];
    csvByState[sName].push(row);
  }

  console.log(`✅ Loaded ${(totalRows - 1).toLocaleString()} CSV records across ${Object.keys(csvByState).length} states.`);

  let totalUpdated = 0;
  let totalAlreadyWithCoords = 0;
  let totalSkippedNoMatch = 0;

  for (const stateName of Object.keys(csvByState)) {
    console.log(`\n⏳ Processing state: ${stateName}...`);
    const csvRows = csvByState[stateName];

    // Load all MongoDB villages for this state
    const mongoDocs = await col.find(
      { state_name: { $regex: '^' + stateName + '$', $options: 'i' } },
      {
        projection: {
          _id: 1,
          master_id: 1,
          village_name: 1,
          village_name_normalized: 1,
          block_name: 1,
          block_code: 1,
          sub_district_census_code_2011: 1,
          district_name: 1,
          census_2001_code: 1,
          census_2011_code: 1,
          village_code_2011: 1,
          centroid_latitude: 1,
          centroid_longitude: 1
        }
      }
    ).toArray();

    // Index MongoDB villages in memory for fast, multi-key matching
    const by2001 = new Map();
    const by2011 = new Map();
    const byBlockCodeVill = new Map();
    const byDistBlockVill = new Map();
    const byBlockVill = new Map();
    const byDistVill = new Map();
    const byUniqueVill = new Map();

    for (const d of mongoDocs) {
      if (d.census_2001_code && d.census_2001_code !== '0') {
        const c = String(parseInt(d.census_2001_code, 10));
        if (!by2001.has(c)) by2001.set(c, []);
        by2001.get(c).push(d);
      }
      const c2011 = d.village_code_2011 || d.census_2011_code;
      if (c2011 && c2011 !== '0') {
        const c = String(parseInt(c2011, 10));
        if (!by2011.has(c)) by2011.set(c, []);
        by2011.get(c).push(d);
      }

      const bCode = d.sub_district_census_code_2011 || d.block_code;
      const vNorm = d.village_name_normalized || normalizeStr(d.village_name);
      const bNorm = normalizeStr(d.block_name);
      const dNorm = normalizeStr(d.district_name);

      if (bCode && vNorm) {
        const k = `${parseInt(bCode, 10)}_${vNorm}`;
        if (!byBlockCodeVill.has(k)) byBlockCodeVill.set(k, []);
        byBlockCodeVill.get(k).push(d);
      }
      if (dNorm && bNorm && vNorm) {
        const k = `${dNorm}_${bNorm}_${vNorm}`;
        if (!byDistBlockVill.has(k)) byDistBlockVill.set(k, []);
        byDistBlockVill.get(k).push(d);
      }
      if (bNorm && vNorm) {
        const k = `${bNorm}_${vNorm}`;
        if (!byBlockVill.has(k)) byBlockVill.set(k, []);
        byBlockVill.get(k).push(d);
      }
      if (dNorm && vNorm) {
        const k = `${dNorm}_${vNorm}`;
        if (!byDistVill.has(k)) byDistVill.set(k, []);
        byDistVill.get(k).push(d);
      }
      if (vNorm) {
        if (!byUniqueVill.has(vNorm)) byUniqueVill.set(vNorm, []);
        byUniqueVill.get(vNorm).push(d);
      }
    }

    const bulkOps = [];
    const touchedMasterIds = new Set();
    let stateUpdated = 0;
    let stateAlready = 0;
    let stateNoMatch = 0;

    for (const r of csvRows) {
      const lat = parseFloat(r.centroid_latitude);
      const lon = parseFloat(r.centroid_longitude);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        continue;
      }

      const rawVCode = (r.village_census_code || '').trim();
      let code2001 = null;
      let code2011 = null;

      if (rawVCode.length === 16) {
        code2001 = String(parseInt(rawVCode.slice(8), 10));
      } else if (rawVCode.length > 0) {
        const num = parseInt(rawVCode, 10);
        if (!isNaN(num)) {
          code2001 = String(num);
          code2011 = String(num);
        }
      }

      const vNorm = normalizeStr(r.village_name);
      const bNorm = normalizeStr(r.block_name);
      const dNorm = normalizeStr(r.district_name);
      const bCode = r.block_code ? parseInt(r.block_code, 10) : null;

      let targetDoc = null;
      let matchMethod = null;

      // Priority 1: Exact 2001 Census Code
      if (code2001 && by2001.has(code2001)) {
        targetDoc = by2001.get(code2001)[0];
        matchMethod = 'census_2001_code';
      }
      // Priority 2: 2011 Census Code
      else if (code2011 && by2011.has(code2011)) {
        targetDoc = by2011.get(code2011)[0];
        matchMethod = 'census_2011_code';
      }
      // Priority 3: Block Code + Village Name
      else if (bCode && vNorm && byBlockCodeVill.has(`${bCode}_${vNorm}`)) {
        targetDoc = byBlockCodeVill.get(`${bCode}_${vNorm}`)[0];
        matchMethod = 'block_code_village';
      }
      // Priority 4: District + Block + Village Name
      else if (dNorm && bNorm && vNorm && byDistBlockVill.has(`${dNorm}_${bNorm}_${vNorm}`)) {
        targetDoc = byDistBlockVill.get(`${dNorm}_${bNorm}_${vNorm}`)[0];
        matchMethod = 'dist_block_village';
      }
      // Priority 5: Block + Village Name
      else if (bNorm && vNorm && byBlockVill.has(`${bNorm}_${vNorm}`)) {
        targetDoc = byBlockVill.get(`${bNorm}_${vNorm}`)[0];
        matchMethod = 'block_village';
      }
      // Priority 6: District + Village Name (if unique)
      else if (dNorm && vNorm && byDistVill.has(`${dNorm}_${vNorm}`) && byDistVill.get(`${dNorm}_${vNorm}`).length === 1) {
        targetDoc = byDistVill.get(`${dNorm}_${vNorm}`)[0];
        matchMethod = 'dist_village_unique';
      }
      // Priority 7: Unique Village Name in State
      else if (vNorm && byUniqueVill.has(vNorm) && byUniqueVill.get(vNorm).length === 1) {
        targetDoc = byUniqueVill.get(vNorm)[0];
        matchMethod = 'state_village_unique';
      }

      if (!targetDoc) {
        stateNoMatch++;
        continue;
      }

      if (touchedMasterIds.has(targetDoc.master_id)) {
        continue;
      }
      touchedMasterIds.add(targetDoc.master_id);

      // Check if already has valid coords
      const hasExisting = targetDoc.centroid_latitude != null && targetDoc.centroid_longitude != null;
      if (hasExisting) {
        stateAlready++;
      } else {
        stateUpdated++;
      }

      // Always update / enrich coordinates and metadata
      bulkOps.push({
        updateOne: {
          filter: { master_id: targetDoc.master_id },
          update: {
            $set: {
              latitude: lat,
              longitude: lon,
              centroid_latitude: lat,
              centroid_longitude: lon,
              location: {
                type: 'Point',
                coordinates: [lon, lat]
              },
              coordinate_match_status: 'matched',
              coordinates_source: 'all_12_states_villages.csv',
              match_method: matchMethod,
              source_village_id: r.village_id || '',
              source_village_census_code: r.village_census_code || '',
              source_village_descriptive_name: r.village_descriptive_name || '',
              source_panchayat_name: r.panchayat_name || '',
              source_panchayat_code: r.panchayat_code || '',
              source_block_name: r.block_name || '',
              source_block_code: r.block_code || '',
              source_district_code: r.district_code || '',
              source_district_census_code: r.district_census_code || '',
              source_state_code: r.state_code || '',
              source_state_census_code: r.state_census_code || '',
              updated_at: new Date()
            }
          }
        }
      });
    }

    if (bulkOps.length > 0) {
      const BATCH = 5000;
      for (let i = 0; i < bulkOps.length; i += BATCH) {
        const slice = bulkOps.slice(i, i + BATCH);
        await col.bulkWrite(slice, { ordered: false });
      }
    }

    totalUpdated += stateUpdated;
    totalAlreadyWithCoords += stateAlready;
    totalSkippedNoMatch += stateNoMatch;

    console.log(`  -> ${stateName}: ${bulkOps.length.toLocaleString()} total matched (${stateUpdated.toLocaleString()} newly updated with coords, ${stateAlready.toLocaleString()} already had coords, ${stateNoMatch.toLocaleString()} unmatched).`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n==================================================');
  console.log('✅ Merge Completed');
  console.log(`📊 Newly Assigned Coordinates: ${totalUpdated.toLocaleString()}`);
  console.log(`📊 Already Had Coordinates:     ${totalAlreadyWithCoords.toLocaleString()}`);
  console.log(`📊 Unmatched:                  ${totalSkippedNoMatch.toLocaleString()}`);
  console.log(`⏱️ Duration:                    ${duration}s`);
  console.log('==================================================');

  // Verify Kothapalle in Kuppam specifically
  const kCheck = await col.findOne({
    state_name: 'Andhra Pradesh',
    district_name: 'Chittoor',
    block_name: { $regex: 'kuppam', $options: 'i' },
    village_name: { $regex: '^kothapalle$', $options: 'i' }
  });

  console.log('\n🔍 Verification check for Kothapalle in Kuppam:');
  console.log({
    master_id: kCheck?.master_id,
    village_name: kCheck?.village_name,
    block_name: kCheck?.block_name,
    district_name: kCheck?.district_name,
    state_name: kCheck?.state_name,
    latitude: kCheck?.latitude,
    longitude: kCheck?.longitude,
    centroid_latitude: kCheck?.centroid_latitude,
    centroid_longitude: kCheck?.centroid_longitude,
    location: kCheck?.location,
    coordinate_match_status: kCheck?.coordinate_match_status
  });

  process.exit(0);
}

runMerge().catch(err => {
  console.error('❌ Fatal merge error:', err);
  process.exit(1);
});
