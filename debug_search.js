
const https = require('https');

const API_KEY = 'YGNrrmPwSWjVY9lAy9y7CiBLMeRUh3pEE4CTmIvfZwnaSp6X3uiQnsVAoDkdXLYW';
const SEARCH_TERM = 'Trae'; // Trying a generic name

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
    console.log(`--- Probing /players/search?username=${SEARCH_TERM} ---`);
    try {
        const res1 = await fetchApi(`/players/search?username=${SEARCH_TERM}`);
        console.log('Result 1:', JSON.stringify(res1, null, 2));
    } catch(e) { console.log('Result 1 failed:', e.message); }

    console.log(`\n--- Probing /players/search?query=${SEARCH_TERM} ---`);
    try {
        const res2 = await fetchApi(`/players/search?query=${SEARCH_TERM}`);
        console.log('Result 2:', JSON.stringify(res2, null, 2));
    } catch(e) { console.log('Result 2 failed:', e.message); }

    // Sometimes search is on root or different path
    console.log(`\n--- Probing /clans/search?name=${SEARCH_TERM} (Control test) ---`);
    try {
        const res3 = await fetchApi(`/clans/search?name=Wolves`); // Control to ensure search works generally
        console.log('Result 3 (Control): Success, found', Array.isArray(res3) ? res3.length : 'obj');
    } catch(e) { console.log('Result 3 failed:', e.message); }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

probe();
