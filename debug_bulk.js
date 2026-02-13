
const https = require('https');

const API_KEY = 'YGNrrmPwSWjVY9lAy9y7CiBLMeRUh3pEE4CTmIvfZwnaSp6X3uiQnsVAoDkdXLYW';
const IDS = ['00814aa3-ec0e-4f52-b022-a9948d98c06a', 'c453c7ee-a60c-4420-8963-0a868ed3b370'];

function fetchApi(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.wolvesville.com',
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${API_KEY}`, 
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON'));
          }
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function probe() {
  try {
    console.log('--- Probing /players/bulk (ids as query) ---');
    try {
        const bulk1 = await fetchApi(`/players/bulk?ids=${IDS.join(',')}`);
        console.log('Bulk 1 success:', JSON.stringify(bulk1, null, 2).substring(0, 200));
    } catch(e) { console.log('Bulk 1 failed:', e.message); }

    console.log('\n--- Probing /players/byIds (ids as query) ---');
    try {
        const bulk2 = await fetchApi(`/players/byIds?ids=${IDS.join(',')}`);
        console.log('Bulk 2 success:', JSON.stringify(bulk2, null, 2).substring(0, 200));
    } catch(e) { console.log('Bulk 2 failed:', e.message); }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

probe();
