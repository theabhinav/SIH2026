const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Narayan Kumar/Downloads/census_pca_villages.jsonl'),
  crlfDelay: Infinity
});

let found = 0;
let samples = [];

rl.on('line', (line) => {
  if (line.includes('239423')) {
    console.log('FOUND 239423:', line);
    found++;
  }
  if (line.includes('"239') && samples.length < 5) {
    samples.push(line);
  }
});

rl.on('close', () => {
  console.log(`Total found for 239423: ${found}`);
  console.log('Samples around 239xxx:');
  samples.forEach(s => console.log(s));
  process.exit(0);
});
