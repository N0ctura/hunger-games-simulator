const fs = require('fs');
const path = require('path');

const files = [
  'verde 110.json',
  'giallo 170.json',
  'NERO + 150 bianco.json'
];

const mergedData = {};

files.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        
        Object.keys(json).forEach(itemId => {
            if (!mergedData[itemId]) {
            mergedData[itemId] = [];
            }
            // The values in the files are arrays like ["color"]
            const colors = json[itemId];
            if (Array.isArray(colors)) {
                colors.forEach(color => {
                    if (!mergedData[itemId].includes(color)) {
                        mergedData[itemId].push(color);
                    }
                });
            }
        });
        console.log(`Processed ${file}`);
    } else {
        console.error(`File not found: ${file}`);
    }
  } catch (e) {
    console.error(`Error processing ${file}:`, e);
  }
});

if (!fs.existsSync('src/data')) {
  fs.mkdirSync('src/data', { recursive: true });
}

fs.writeFileSync('src/data/color-calibration.json', JSON.stringify(mergedData, null, 2));
console.log('Merged data written to src/data/color-calibration.json');
