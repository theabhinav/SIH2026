const http = require('http');

function makeRequest(pathName) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:8001${pathName}`, (res) => {
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
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

async function test() {
  console.log('=== 1. TESTING URBAN CENSUS TOWN: SABOUR (CT) ===');
  const resSabourCatchment = await makeRequest('/api/villages/c2011_10_192_1338_239423/catchment');
  console.log('Sabour Catchment 5km:', resSabourCatchment.body.catchment_5km);
  console.log('Sabour Catchment 10km:', resSabourCatchment.body.catchment_10km);

  const resSabourMI = await makeRequest('/api/market-intelligence?masterId=c2011_10_192_1338_239423&category=Poultry%20Farming');
  console.log('\nSabour MI 5km Catchment:', resSabourMI.body.catchment_5km);
  console.log('Sabour MI 10km Catchment:', resSabourMI.body.catchment_10km);

  console.log('\n=== 2. TESTING CONTROL RURAL VILLAGE: KOTHAPALLE ===');
  const resKothapalleCatchment = await makeRequest('/api/villages/c2011_28_503_5427_596930/catchment');
  console.log('Kothapalle Catchment 5km:', {
    village_count: resKothapalleCatchment.body.catchment_5km.village_count,
    population: resKothapalleCatchment.body.catchment_5km.population,
    demographics_available: resKothapalleCatchment.body.catchment_5km.demographics_available,
    missing_demographics_count: resKothapalleCatchment.body.catchment_5km.missing_demographics_count,
    reason: resKothapalleCatchment.body.catchment_5km.reason
  });

  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
