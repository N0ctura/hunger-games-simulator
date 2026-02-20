const API_KEY = "YGNrrmPwSWjVY9lAy9y7CiBLMeRUh3pEE4CTmIvfZwnaSp6X3uiQnsVAoDkdXLYW";
const BASE_URL = "https://api.wolvesville.com";

async function fetchEndpoint(endpoint) {
    console.log(`Fetching ${endpoint}...`);
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                "Authorization": `Bot ${API_KEY}`,
                "Accept": "application/json"
            }
        });
        if (!response.ok) {
            console.error(`Error ${response.status}: ${response.statusText}`);
            return [];
        }
        return await response.json();
    } catch (e) {
        console.error("Fetch error:", e);
        return [];
    }
}

async function run() {
    console.log("Starting raw debug...");

    // 1. Active Offers
    const offers = await fetchEndpoint("/shop/activeOffers");
    console.log(`Offers: ${offers.length}`);
    const roleOffers = offers.filter(o => JSON.stringify(o).toLowerCase().includes("role"));
    console.log(`Role Offers: ${roleOffers.length}`);
    if (roleOffers.length > 0) {
        console.log("Sample Role Offer:", JSON.stringify(roleOffers[0], null, 2));
    }

    // 2. Bundles
    const bundles = await fetchEndpoint("/items/bundles");
    console.log(`Bundles: ${bundles.length}`);
    const roleBundles = bundles.filter(b => JSON.stringify(b).toLowerCase().includes("role"));
    console.log(`Role Bundles: ${roleBundles.length}`);
    if (roleBundles.length > 0) {
        console.log("Sample Role Bundle:", JSON.stringify(roleBundles[0], null, 2));
    }

    // 3. Avatar Sets
    const sets = await fetchEndpoint("/items/avatarItemSets");
    console.log(`Sets: ${sets.length}`);
    const roleSets = sets.filter(s => JSON.stringify(s).toLowerCase().includes("role"));
    console.log(`Role Sets: ${roleSets.length}`);
    if (roleSets.length > 0) {
        console.log("Sample Role Set:", JSON.stringify(roleSets[0], null, 2));
    }

    // 4. Simulate Context Logic
    console.log("\n--- Simulating Context Logic ---");
    const bundleSets = [];
    bundles.forEach(bundle => {
        // 1. Nested Sets
        if (bundle.avatarItemSets && Array.isArray(bundle.avatarItemSets)) {
            const nestedSets = bundle.avatarItemSets.map(s => ({
                ...s,
                name: s.name || bundle.name || `Bundle ${bundle.id}`
            }));
            bundleSets.push(...nestedSets);
        }
    });
    console.log(`Extracted ${bundleSets.length} sets from Bundles.`);
    if (bundleSets.length > 0) {
        console.log("Sample Extracted Set:", JSON.stringify(bundleSets[0], null, 2));
    }
}

run();
