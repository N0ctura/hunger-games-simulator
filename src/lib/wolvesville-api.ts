import { WovRole, WovAvatarSet, WovBackground } from "./wolvesville-types";
import { getCdnUrl, WOV_MANUAL_MAPPING } from "./wov-mapping";

const BASE_URL = "https://api.wolvesville.com";
const API_KEY = process.env.NEXT_PUBLIC_WOLVESVILLE_API_KEY;
const BOT_ID = process.env.NEXT_PUBLIC_WOLVESVILLE_BOT_ID;

console.log("[WovAPI] Key detected:", !!API_KEY);


/**
 * Generic fetcher with error handling and authorization headers
 */
async function fetchWov<T>(endpoint: string): Promise<T | null> {
  // If no API key, return null to trigger mock/fallback logic
  if (!API_KEY) {
    console.warn(`[WovAPI] Missing API Key. Mocking request to ${endpoint}`);
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bot ${API_KEY}`,
        ...(BOT_ID ? { "X-Bot-ID": BOT_ID } : {})
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`[WovAPI] Error ${response.status}: ${response.statusText} for ${endpoint}`);
      return null;
    }

    const data = await response.json();
    console.log(`[WovAPI] Response status: ${response.status}`);
    console.log(`[WovAPI] Raw Data for ${endpoint}:`, data);

    return data;
  } catch (error) {
    console.error(`[WovAPI] Network error for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Fetch Game Roles
 */
export async function fetchRoles(): Promise<WovRole[]> {
  const data = await fetchWov<{ items: WovRole[] }>("/roles");

  if (!data || !data.items) {
    return [];
  }

  return data.items;
}

/**
 * Fetch Avatar Item Sets
 * Returns a list of sets, but also useful for extracting individual items
 */
export async function fetchAvatarSets(): Promise<WovAvatarSet[]> {
  // Use a cursor-based pagination if needed in future, for now fetch default page
  const data = await fetchWov<{ items: WovAvatarSet[] }>("/items/avatarItemSets");

  if (!data || !data.items) {
    return [];
  }

  return data.items;
}

/**
 * Extract all unique items from a list of sets
 * Flattens the hierarchy to show a grid of items
 */
export function extractAllItems(sets: WovAvatarSet[]): import("./wolvesville-types").WovAvatarItem[] {
  const allItems: import("./wolvesville-types").WovAvatarItem[] = [];
  const seenIds = new Set<string>();

  sets.forEach(set => {
    if (set.items) {
      set.items.forEach(item => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          // Enrich item with set name if needed or ensure image URL is correct
          allItems.push({
            ...item,
            imageUrl: resolveImageUrl(item.id, "avatar", item.imageUrl),
            name: item.name || `${set.name} Item` // Fallback name if missing
          });
        }
      });
    }
  });

  return allItems;
}

/**
 * Fetch Backgrounds
 */
export async function fetchBackgrounds(): Promise<WovBackground[]> {
  const data = await fetchWov<{ items: WovBackground[] }>("/items/backgrounds");

  if (!data || !data.items) {
    return [];
  }

  return data.items;
}

/**
 * Smart Image Resolver
 * Tries to find the best image URL: API > Mapping > CDN Construction > Placeholder
 */
export function resolveImageUrl(id: string, type: "role" | "background" | "avatar", apiValue?: string): string {
  // 1. Use API value if present
  if (apiValue) return apiValue;

  // 2. Check Manual Mapping
  if (WOV_MANUAL_MAPPING[id]) {
    return WOV_MANUAL_MAPPING[id].cdnUrl;
  }

  // 3. Construct CDN URL
  return getCdnUrl(id, type);
}
