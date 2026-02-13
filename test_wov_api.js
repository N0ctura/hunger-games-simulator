const https = require('https');

const API_KEY = process.env.NEXT_PUBLIC_WOLVESVILLE_API_KEY || 'YGNrrmPwSWjVY9lAy9y7CiBLMeRUh3pEE4CTmIvfZwnaSp6X3uiQnsVAoDkdXLYW';
const BOT_ID = process.env.NEXT_PUBLIC_WOLVESVILLE_BOT_ID || 'f416123a-0ca8-432f-94e4-228afdef82e2';

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bot ${API_KEY}`
};

function fetchEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.wolvesville.com',
      path: path,
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Status Code: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function run() {
  try {
    console.log('--- Fetching /items/avatarItems ---');
    const avatarItems = await fetchEndpoint('/items/avatarItems');
    console.log(`Fetched ${avatarItems.length} avatar items.`);

    // Analyze types
    const types = new Set();
    const skinCandidates = [];

    avatarItems.forEach(item => {
      if (item.type) types.add(item.type);
      if (JSON.stringify(item).toLowerCase().includes('skin')) {
        skinCandidates.push(item);
      }
    });

    console.log('Unique Types in avatarItems:', Array.from(types));
    console.log(`Found ${skinCandidates.length} items with "skin" in their data.`);
    if (skinCandidates.length > 0) {
      console.log('Example skin candidate:', JSON.stringify(skinCandidates[0], null, 2));
    }

    console.log('\n--- Fetching /items/roseSkins ---');
    try {
      const roseSkins = await fetchEndpoint('/items/roseSkins');
      console.log(`Fetched ${roseSkins.length} rose skins.`);
      if (roseSkins.length > 0) {
        console.log('Example rose skin:', JSON.stringify(roseSkins[0], null, 2));
      }
    } catch (e) {
      console.error('Error fetching roseSkins:', e.message);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
