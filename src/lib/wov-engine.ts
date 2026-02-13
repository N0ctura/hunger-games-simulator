import {
  WovRole,
  WovAvatarSet,
  WovBackground,
  WovLoadingScreen,
  WovClanQuest,
  WovAvatarItem,
  WovClan
} from "./wolvesville-types";
import {
  FALLBACK_ROLES,
  FALLBACK_AVATAR_SETS,
  FALLBACK_BACKGROUNDS,
  FALLBACK_LOADING_SCREENS,
  FALLBACK_CLAN_QUESTS
} from "./wov-fallback-data";
import { getCdnUrl, WOV_MANUAL_MAPPING } from "./wov-mapping";
import { getCategoryFromId, enrichItem, DEFAULT_SKINS } from "./item-mapper";

const BASE_URL = "https://api.wolvesville.com";
const API_KEY = process.env.NEXT_PUBLIC_WOLVESVILLE_API_KEY;
const BOT_ID = process.env.NEXT_PUBLIC_WOLVESVILLE_BOT_ID;

// Cache Duration in Milliseconds (e.g., 10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<any>> = {};

/**
 * WovEngine: Unified Engine for Wolvesville Data Fetching and Management
 */
export const WovEngine = {

  /**
   * Core Fetcher with Caching and Fallback Logic
   */
  async fetch<T>(endpoint: string, fallbackData: T): Promise<T> {
    const cacheKey = endpoint;
    const now = Date.now();

    // 1. Check Cache
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_DURATION)) {
      // console.log(`[WovEngine] Cache Hit for ${endpoint}`);
      return cache[cacheKey].data;
    }

    // 2. Check API Key
    if (!API_KEY) {
      console.warn(`[WovEngine] No API Key. Using fallback for ${endpoint}`);
      return fallbackData;
    }

    try {
      // 3. Fetch Data
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Language": "it",
          "Authorization": `Bot ${API_KEY}`,
          ...(BOT_ID ? { "X-Bot-ID": BOT_ID } : {})
        },
        next: { revalidate: 3600 }
      });

      if (!response.ok) {
        console.error(`[WovEngine] API Error ${response.status} for ${endpoint}`);
        return fallbackData;
      }

      const raw = await response.json();
      const data = raw.items ? raw.items : raw; // Handle both wrapper and direct arrays if any

      // 4. Update Cache
      cache[cacheKey] = { data, timestamp: now };

      return data as T;
    } catch (error) {
      console.error(`[WovEngine] Network Exception for ${endpoint}`, error);
      return fallbackData;
    }
  },

  /**
   * Specific Data Methods
   */

  async getRoles(): Promise<WovRole[]> {
    const response = await this.fetch<any>("/roles", { roles: FALLBACK_ROLES });
    const rolesRaw = response.roles ? response.roles : response;

    if (!Array.isArray(rolesRaw) || rolesRaw.length === 0) {
      console.warn("[WovEngine] Roles empty or invalid format, forcing fallback data");
      return FALLBACK_ROLES;
    }

    // Process Advanced Roles Mapping
    const mapping = response.advancedRolesMapping || {};
    const advancedRoleIds = new Set<string>();

    Object.values(mapping).forEach((ids: any) => {
      if (Array.isArray(ids)) {
        ids.forEach((id: string) => advancedRoleIds.add(id));
      }
    });

    // Enrich roles with isAdvanced flag
    const roles: WovRole[] = rolesRaw.map((role: WovRole) => ({
      ...role,
      isAdvanced: advancedRoleIds.has(role.id)
    }));

    return roles;
  },

  async getAvatarSets(): Promise<WovAvatarSet[]> {
    return this.fetch<WovAvatarSet[]>("/items/avatarItemSets", FALLBACK_AVATAR_SETS);
  },

  async getBundles(): Promise<WovAvatarSet[]> {
    return this.fetch<WovAvatarSet[]>("/items/bundles", []);
  },

  async getShopActiveOffers(): Promise<any[]> {
    return this.fetch<any[]>("/shop/activeOffers", []);
  },

  async getCalendars(): Promise<any[]> {
    return this.fetch<any[]>("/items/calendars", []);
  },

  async getAvatarItems(): Promise<WovAvatarItem[]> {
    // Try to fetch individual items with metadata
    const items = await this.fetch<WovAvatarItem[]>("/items/avatarItems", []);
    const enriched = items.map(enrichItem);
    // Add default skins to the beginning of the list
    return [...DEFAULT_SKINS, ...enriched];
  },

  async getBackgrounds(): Promise<WovBackground[]> {
    return this.fetch<WovBackground[]>("/items/backgrounds", FALLBACK_BACKGROUNDS);
  },

  async getLoadingScreens(): Promise<WovLoadingScreen[]> {
    // Note: Endpoint hypothetical based on pattern, falling back if not real
    return this.fetch<WovLoadingScreen[]>("/items/loadingScreens", FALLBACK_LOADING_SCREENS);
  },

  async getRoleIcons(): Promise<any[]> {
    return this.fetch<any[]>("/items/roleIcons", []);
  },

  async getClanQuests(): Promise<WovClanQuest[]> {
    return this.fetch<WovClanQuest[]>("/clans/quests/all", FALLBACK_CLAN_QUESTS);
  },

  async searchClans(options: string | import("./wolvesville-types").ClanSearchOptions): Promise<WovClan[]> {
    const params = new URLSearchParams();

    if (typeof options === "string") {
      params.append("name", options);
    } else {
      if (options.name) params.append("name", options.name);
      if (options.minLevel) params.append("minLevel", options.minLevel.toString());
      if (options.language) params.append("language", options.language);
      if (options.joinType) params.append("joinType", options.joinType);
      if (options.sortBy) params.append("sortBy", options.sortBy);
      if (options.notFull) params.append("notFull", "true");
    }

    return this.fetch<WovClan[]>(`/clans/search?${params.toString()}`, []);
  },

  /**
   * Helper: Flatten Sets into Items
   */
  extractItems(sets: WovAvatarSet[]): WovAvatarItem[] {
    console.log(`[WovEngine] Extracting items from ${sets?.length || 0} sets`);

    if (!sets || !Array.isArray(sets)) {
      console.warn("[WovEngine] Invalid sets data:", sets);
      return [];
    }

    // Debug: Log first set structure (outside loop)
    if (sets.length > 0) {
      console.log("[WovDebug] First set received:", sets[0]);
    }

    const allItems: WovAvatarItem[] = [];
    const seenIds = new Set<string>();

    sets.forEach(set => {
      // Strategy A: 'items' array (full objects)
      if (set.items && Array.isArray(set.items)) {
        set.items.forEach(item => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(enrichItem({
              ...item,
              imageUrl: this.resolveImageUrl(item.id, "avatar", item.imageUrl),
              name: item.name || `${set.name || 'Unknown Set'} Item`
            }));
          }
        });
      }
      // Strategy B: 'avatarItemIds' array (just IDs)
      else if (set.avatarItemIds && Array.isArray(set.avatarItemIds)) {
        set.avatarItemIds.forEach(id => {
          if (!seenIds.has(id)) {
            seenIds.add(id);
            const category = getCategoryFromId(id);
            allItems.push(enrichItem({
              id: id,
              name: `Item ${id.substring(0, 5)}...`, // Placeholder name
              type: (category as any) || "SHIRT", // Use mapped category or default
              rarity: "COMMON", // Placeholder rarity
              imageUrl: this.resolveImageUrl(id, "avatar", undefined, category || undefined)
            }));
          }
        });
      }
    });

    console.log(`[WovEngine] Extracted ${allItems.length} unique items`);
    return allItems;
  },

  /**
   * Image Resolution Logic
   */
  resolveImageUrl(id: string, type: "role" | "background" | "avatar", apiValue?: string, category?: string): string {
    // 1. Trust the API provided URL first (User instruction: "usa l api")
    if (apiValue && !apiValue.includes("dicebear")) {
      return apiValue;
    }

    // 2. Fallback to manual mapping if available
    if (WOV_MANUAL_MAPPING[id]) return WOV_MANUAL_MAPPING[id].cdnUrl;

    // 3. Last resort: Construct URL manually
    return getCdnUrl(id, type);
  },

  /**
   * Generate Shared Avatar URL
   * Simulates the POST request or constructs the URL if possible client-side
   */
  async generateSharedAvatarUrl(items: string[]): Promise<string | null> {
    if (!API_KEY) return null;

    try {
      const body = {
        items: items.map(id => ({ id, prio: 0 })),
        skinColorId: "default"
      };

      const response = await fetch(`${BASE_URL}/avatars/sharedAvatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bot ${API_KEY}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.url; // Assuming returns { url: "..." }
    } catch (e) {
      console.error("Failed to generate avatar URL", e);
      return null;
    }
  }
};
