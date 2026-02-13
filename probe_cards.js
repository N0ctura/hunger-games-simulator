
const https = require('https');

const API_KEY = process.env.NEXT_PUBLIC_WOLVESVILLE_API_KEY || 'YGNrrmPwSWjVY9lAy9y7CiBLMeRUh3pEE4CTmIvfZwnaSp6X3uiQnsVAoDkdXLYW';

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': `Bot ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) resolve(JSON.parse(data));
          else resolve(null);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  // Search for a player known to have high level stuff or just inspect the previous one
  const searchResult = await fetchJson('https://api.wolvesville.com/players/search?username=eduardito');
  if (!searchResult) return console.log("Player not found");
  
  const profile = await fetchJson(`https://api.wolvesville.com/players/${searchResult.id}`);
  
  if (profile && profile.roleCards) {
    console.log(`Found ${profile.roleCards.length} role cards.`);
    
    // Group by rarity to see what values exist
    const rarities = {};
    profile.roleCards.forEach(c => {
      rarities[c.rarity] = (rarities[c.rarity] || 0) + 1;
    });
    console.log("Rarities:", rarities);

    // Inspect first 3 cards fully
    console.log("--- First 3 Cards ---");
    profile.roleCards.slice(0, 3).forEach((c, i) => {
      console.log(`Card ${i}:`, JSON.stringify(c, null, 2));
    });

    // Check for cards with more than 2 abilities/perks
    const complexCards = profile.roleCards.filter(c => {
      // Check for array fields or high numbered fields
      return Object.keys(c).some(k => k.includes('ability') || k.includes('perk') || k.includes('upgrade'));
    });

    if (complexCards.length > 0) {
      console.log("--- Complex Card Keys ---");
      const keys = new Set();
      complexCards.forEach(c => Object.keys(c).forEach(k => keys.add(k)));
      console.log(Array.from(keys).sort());
      
      console.log("--- Example Complex Card ---");
      console.log(JSON.stringify(complexCards[0], null, 2));
    }
  } else {
    console.log("No role cards found.");
  }
}

run();
