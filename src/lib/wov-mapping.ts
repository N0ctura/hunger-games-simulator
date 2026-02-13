import { WovRarity, WovCategory } from "./wolvesville-types";

// Manual mapping for items that are hard to fetch or need CDN direct links
// This is a fallback/extension database
export const WOV_MANUAL_MAPPING: Record<string, {
  name: string;
  rarity: WovRarity;
  category?: WovCategory;
  cdnUrl: string;
}> = {
  // Example mappings - updated with real IDs
  "aura-seer": {
    name: "Veggente",
    rarity: "COMMON",
    cdnUrl: "https://cdn.wolvesville.com/roleIcons/aura-seer.png"
  },
  "werewolf": {
    name: "Lupo Mannaro",
    rarity: "COMMON",
    cdnUrl: "https://cdn.wolvesville.com/roleIcons/werewolf.png"
  },
  "bg_village": {
    name: "Villaggio (Default)",
    rarity: "COMMON",
    cdnUrl: "https://cdn.wolvesville.com/backgrounds/wolvesville_large_day.png"
  }
};

/**
 * Helper to construct CDN URLs if API data is missing
 * Updated with correct paths and HD suffix support
 */
export const getCdnUrl = (id: string, type: "role" | "background" | "avatar" | "set", highRes: boolean = true): string => {
  const baseUrl = "https://cdn.wolvesville.com";
  const suffix = highRes ? "@2x.png" : ".png";

  switch (type) {
    case "role":
      // Roles typically use simple .png in roleIcons folder based on official structure
      // e.g. https://cdn.wolvesville.com/roleIcons/werewolf.png
      return `${baseUrl}/roleIcons/${id}.png`;

    case "background":
      // Backgrounds often have specific naming conventions. 
      // Defaulting to large_day format if generic ID is passed, otherwise using ID directly
      // If ID already contains extension or full path, return as is (handled by caller logic usually)
      if (id === "village_day") return `${baseUrl}/backgrounds/wolvesville_large_day.png`;
      return `${baseUrl}/backgrounds/${id}${highRes ? "" : ""}`; // Backgrounds usually are jpg/png without @2x suffix in some contexts, but let's stick to provided URLs

    case "avatar":
      // Avatar items support resolution suffixes
      // Some items might be store items, but generally avatarItems/{id} works
      // If it fails, one might need to try .store.png but let's stick to standard first
      return `${baseUrl}/avatarItems/${id}${suffix}`;

    case "set":
      // Store sets usually reside in avatarItemSets
      return `${baseUrl}/avatarItemSets/${id}${suffix}`;

    default:
      return "";
  }
};
