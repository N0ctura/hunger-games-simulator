
const https = require('https');

const API_KEY = "YGNrrmPwSWjVY9lAy9y7CiBLMeRUh3pEE4CTmIvfZwnaSp6X3uiQnsVAoDkdXLYW";
const BOT_ID = "f416123a-0ca8-432f-94e4-228afdef82e2";

function fetch(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bot ${API_KEY}`,
                'X-Bot-ID': BOT_ID
            }
        };

        console.log("Fetching URL:", url);
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        console.log(`Error ${res.statusCode} for ${url}`);
                        resolve(null);
                    }
                } catch (e) {
                    console.log("Parse Error");
                    resolve(null);
                }
            });
        }).on('error', (e) => {
            console.error("Request Error:", e);
            reject(e);
        });
    });
}

async function run() {
    console.log("Searching for 'eduardito'...");
    const searchResult = await fetch('https://api.wolvesville.com/players/search?username=eduardito');

    if (!searchResult) {
        console.log("Search failed.");
        return;
    }

    const playerId = searchResult.id;
    console.log(`Found ID: ${playerId}`);

    console.log(`Fetching profile for ${playerId}...`);
    const profile = await fetch(`https://api.wolvesville.com/players/${playerId}`);

    if (profile) {
        console.log("TOP LEVEL KEYS:", Object.keys(profile));

        // Check for anything role related
        const potentialRoleKeys = Object.keys(profile).filter(k => k.toLowerCase().includes('role') || k.toLowerCase().includes('card'));
        console.log("Potential Role Keys:", potentialRoleKeys);

        if (profile.roleCards) {
            console.log("Found 'roleCards'. Count:", profile.roleCards.length);
            console.log("First card sample:", JSON.stringify(profile.roleCards[0], null, 2));
        }

        if (profile.badgeIds) {
            console.log("Found 'badgeIds'. Count:", profile.badgeIds.length);
            console.log("First badge sample:", profile.badgeIds[0]);
        }

        console.log("Game Stats keys:", Object.keys(profile.gameStats || {}));

        if (profile.gameStats && profile.gameStats.achievements) {
            console.log("Achievements found inside gameStats!");
            console.log("Achievements structure (keys):", Object.keys(profile.gameStats.achievements));
            // Log first few entries
            const entries = Object.entries(profile.gameStats.achievements);
            console.log("First 3 achievements:", entries.slice(0, 3));
        }
    } else {
        console.log("Profile fetch failed.");
    }
}

run();
