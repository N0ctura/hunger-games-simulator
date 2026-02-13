
const https = require('https');

const API_KEY = 'YGNrrmPwSWjVY9lAy9y7CiBLMeRUh3pEE4CTmIvfZwnaSp6X3uiQnsVAoDkdXLYW';
const BOT_ID = '350';
const PLAYER_ID = '00814aa3-ec0e-4f52-b022-a9948d98c06a'; // eduardito from highscores

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
    console.log(`--- Probing /players/${PLAYER_ID} ---`);
    const player = await fetchApi(`/players/${PLAYER_ID}`);
    console.log(JSON.stringify(player, null, 2));

    // Check if there is an avatar or profileIcon field
    if (player.equippedAvatar) {
        console.log('Found equippedAvatar:', JSON.stringify(player.equippedAvatar, null, 2));
    }
    if (player.profileIcon) {
        console.log('Found profileIcon:', JSON.stringify(player.profileIcon, null, 2));
    }
    
    // Also try /players/{id}/avatar just in case
    /*
    console.log(`\n--- Probing /players/${PLAYER_ID}/avatar ---`);
    try {
        const avatar = await fetchApi(`/players/${PLAYER_ID}/avatar`);
        console.log(JSON.stringify(avatar, null, 2));
    } catch(e) { console.log("No specific avatar endpoint found"); }
    */

  } catch (error) {
    console.error('Error:', error.message);
  }
}

probe();
