
const https = require('https');

const API_KEY = 'YGNrrmPwSWjVY9lAy9y7CiBLMeRUh3pEE4CTmIvfZwnaSp6X3uiQnsVAoDkdXLYW';
const BOT_ID = '350';

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
    console.log('--- Probing /ranked/leaderboard ---');
    const leaderboard = await fetchApi('/ranked/leaderboard');
    console.log('Type:', typeof leaderboard);
    console.log('Is Array:', Array.isArray(leaderboard));
    if (!Array.isArray(leaderboard)) {
        console.log('Keys:', Object.keys(leaderboard));
        // Print first item of any array property
        for (const key of Object.keys(leaderboard)) {
            if (Array.isArray(leaderboard[key])) {
                console.log(`Key '${key}' is Array of length ${leaderboard[key].length}`);
                if (leaderboard[key].length > 0) {
                    console.log(`Sample item from '${key}':`, JSON.stringify(leaderboard[key][0], null, 2));
                }
            }
        }
    } else {
        console.log('Length:', leaderboard.length);
        if (leaderboard.length > 0) console.log('Sample:', JSON.stringify(leaderboard[0], null, 2));
    }

    console.log('\n--- Probing /players/highscores ---');
    const highscores = await fetchApi('/players/highscores');
    console.log('Type:', typeof highscores);
    console.log('Is Array:', Array.isArray(highscores));
    if (!Array.isArray(highscores)) {
        console.log('Keys:', Object.keys(highscores));
        for (const key of Object.keys(highscores)) {
            if (Array.isArray(highscores[key])) {
                console.log(`Key '${key}' is Array of length ${highscores[key].length}`);
                if (highscores[key].length > 0) {
                    console.log(`Sample item from '${key}':`, JSON.stringify(highscores[key][0], null, 2));
                }
            }
        }
    } else {
        console.log('Length:', highscores.length);
        if (highscores.length > 0) console.log('Sample:', JSON.stringify(highscores[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

probe();
