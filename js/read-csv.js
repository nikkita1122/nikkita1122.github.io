const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const results = [];

fs.createReadStream(path.join(__dirname, '../California Flora Fauna Flashcards - flashcards.csv'))
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // Save it as a JSON file in the public folder (maybe in js/)
    fs.writeFileSync(path.join(__dirname, 'flashcards-data.json'), JSON.stringify(results, null, 2));
    console.log('✅ CSV converted to JSON and saved as flashcards-data.json');
  });