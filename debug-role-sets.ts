import { WovEngine } from "./src/lib/wov-engine";

// Mock environment variables for standalone script
process.env.NEXT_PUBLIC_WOLVESVILLE_API_KEY = "YGNrrmPwSWjVY9lAy9y7CiBLMeRUh3pEE4CTmIvfZwnaSp6X3uiQnsVAoDkdXLYW";
process.env.NEXT_PUBLIC_WOLVESVILLE_BOT_ID = "f416123a-0ca8-432f-94e4-228afdef82e2";

async function debugRoleSets() {
  console.log("Debugging Role Sets...");

  try {
    // 1. Fetch Offers
    console.log("Fetching Offers...");
    const offers = await WovEngine.getShopActiveOffers();
    console.log(`Found ${offers.length} offers.`);

    // Check for Role Icon related offers
    const roleIconOffers = offers.filter((o: any) =>
      JSON.stringify(o).toLowerCase().includes("role") ||
      JSON.stringify(o).toLowerCase().includes("icon")
    );

    console.log(`Found ${roleIconOffers.length} potential Role Icon offers.`);
    if (roleIconOffers.length > 0) {
      console.log("Example Role Icon Offer:", JSON.stringify(roleIconOffers[0], null, 2));
    }

    // 2. Fetch Avatar Sets
    console.log("Fetching Avatar Sets...");
    const sets = await WovEngine.getAvatarSets();
    console.log(`Found ${sets.length} sets.`);

    const roleIconSets = sets.filter((s: any) =>
      JSON.stringify(s).toLowerCase().includes("role") ||
      JSON.stringify(s).toLowerCase().includes("icon")
    );
    console.log(`Found ${roleIconSets.length} potential Role Icon sets.`);
    if (roleIconSets.length > 0) {
      console.log("Example Role Icon Set:", JSON.stringify(roleIconSets[0], null, 2));
    }

    // 3. Fetch Bundles
    console.log("Fetching Bundles...");
    const bundles = await WovEngine.getBundles();
    console.log(`Found ${bundles.length} bundles.`);

    const roleIconBundles = bundles.filter((b: any) =>
      JSON.stringify(b).toLowerCase().includes("role") ||
      JSON.stringify(b).toLowerCase().includes("icon")
    );
    console.log(`Found ${roleIconBundles.length} potential Role Icon bundles.`);
    if (roleIconBundles.length > 0) {
      console.log("Example Role Icon Bundle:", JSON.stringify(roleIconBundles[0], null, 2));
    }

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

debugRoleSets();
