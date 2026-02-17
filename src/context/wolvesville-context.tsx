"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { WovAvatarItem, WovRole, WovBackground, WovAvatarSet, WovShopOffer, WovCalendar, WovRankedSeason, WovPlayerLeaderboardEntry, CalibrationMap, DEFAULT_CALIBRATION, CalibrationData, WovCategory, WovDensity, WovRarity } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import { enrichItem } from "@/lib/item-mapper";

const DEFAULT_CALIBRATION_MAP: CalibrationMap = {
  // Defaults are now handled in AvatarCanvas via "Pixels from Top" logic.
  // We keep this empty to avoid legacy offsets interfering.
  // User calibration will be additive to the base defaults.
};

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────

interface WolvesvilleContextType {
  roles: WovRole[];
  items: WovAvatarItem[];
  sets: WovAvatarSet[];
  backgrounds: WovBackground[];
  activeOffers: WovShopOffer[];
  calendars: WovCalendar[];
  roleIcons: any[];
  rankedSeason: WovRankedSeason | null;
  leaderboard: WovPlayerLeaderboardEntry[];
  highscores: WovPlayerLeaderboardEntry[];
  loading: boolean;
  error: string | null;

  // Wardrobe
  equippedItems: Record<string, WovAvatarItem>;
  equipItem: (item: WovAvatarItem) => void;
  equipSet: (set: WovAvatarSet) => void;
  unequipItem: (type: string) => void;
  clearWardrobe: () => void;
  isEquipped: (itemId: string) => boolean;

  // Calibration
  calibrationMap: CalibrationMap;
  updateCalibration: (category: WovCategory, density: WovDensity, data: Partial<CalibrationData>) => void;
  batchUpdateCalibration: (updates: CalibrationMap) => void;
  resetCalibration: () => void;

  // UI Settings
  avatarScale: number;
  setAvatarScale: (scale: number) => void;

  // Filter Settings
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRarity: WovRarity | "ALL";
  setSelectedRarity: (rarity: WovRarity | "ALL") => void;
  gridColumns: number;
  setGridColumns: (cols: number) => void;
  sortBy: "DEFAULT" | "LEGENDARY";
  setSortBy: (sort: "DEFAULT" | "LEGENDARY") => void;
}

const WolvesvilleContext = createContext<WolvesvilleContextType | undefined>(undefined);

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/**
 * Normalise whatever the API returns for avatar items.
 *
 * FIX #1 – PARSING BUG
 * The Wolvesville API wraps items inside { items: [...] } for the
 * /items/avatarItems endpoint BUT WovEngine.fetch() already unwraps
 * the `.items` property (line: `const data = raw.items ? raw.items : raw`).
 *
 * For /items/avatarItemSets the response is a plain array of sets,
 * each of which has its own `.items` array — NOT re-wrapped at the top level.
 * So after WovEngine.fetch() we get: WovAvatarSet[] directly.
 *
 * The bug in previous iterations: when `directItems` came back as an object
 * (e.g. the full response body) instead of an array, `directItems.length`
 * was `undefined`, which is falsy → fell through to the sets path.
 * Inside the sets path, if the API returns `{ avatarItemIds: [...] }` instead
 * of `{ items: [...] }`, the inner `set.items` check also fails silently.
 *
 * This helper makes both paths robust.
 */
function normaliseItems(raw: unknown): WovAvatarItem[] {
  if (!raw) return [];

  // Already an array → return as-is
  if (Array.isArray(raw)) return raw as WovAvatarItem[];

  // Object with .items array (unexpected double-wrap)
  if (typeof raw === "object" && "items" in (raw as object)) {
    const r = raw as { items: unknown };
    if (Array.isArray(r.items)) return r.items as WovAvatarItem[];
  }

  return [];
}

function buildItemsFromSets(sets: unknown): WovAvatarItem[] {
  if (!Array.isArray(sets) || sets.length === 0) return [];

  const seen = new Map<string, WovAvatarItem>();

  (sets as any[]).forEach((set) => {
    // Path A: set.items  → full item objects
    const rawItems: any[] = Array.isArray(set.items) ? set.items : [];

    // FIX #2 – MISSING FALLBACK PATH
    // Path B: set.avatarItemIds → only IDs (stub objects)
    const rawIds: string[] = Array.isArray(set.avatarItemIds) ? set.avatarItemIds : [];

    rawItems.forEach((item: any) => {
      if (!item?.id || seen.has(item.id)) return;
      seen.set(item.id, item as WovAvatarItem);
    });

    rawIds.forEach((id: string) => {
      if (!id || seen.has(id)) return;
      seen.set(id, {
        id,
        name: set.name ? `${set.name} – ${id.slice(0, 8)}` : id,
        type: "SHIRT",   // will be overridden by enrichItem if mapping exists
        rarity: "COMMON",
        imageUrl: "",
      } as WovAvatarItem);
    });
  });

  return Array.from(seen.values());
}

function enrichAndResolve(items: WovAvatarItem[]): WovAvatarItem[] {
  return items.map((item) => {
    const enriched = enrichItem(item);
    enriched.imageUrl = WovEngine.resolveImageUrl(
      enriched.id,
      "avatar",
      enriched.imageUrl,
      enriched.type
    );
    return enriched;
  });
}

// ─────────────────────────────────────────────
//  PROVIDER
// ─────────────────────────────────────────────

export function WolvesvilleProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<WovRole[]>([]);
  const [items, setItems] = useState<WovAvatarItem[]>([]);
  const [sets, setSets] = useState<WovAvatarSet[]>([]);
  const [backgrounds, setBackgrounds] = useState<WovBackground[]>([]);
  const [activeOffers, setActiveOffers] = useState<WovShopOffer[]>([]);
  const [calendars, setCalendars] = useState<WovCalendar[]>([]);
  const [roleIcons, setRoleIcons] = useState<any[]>([]);
  const [rankedSeason, setRankedSeason] = useState<WovRankedSeason | null>(null);
  const [leaderboard, setLeaderboard] = useState<WovPlayerLeaderboardEntry[]>([]);
  const [highscores, setHighscores] = useState<WovPlayerLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [equippedItems, setEquippedItems] = useState<Record<string, WovAvatarItem>>({});
  const [calibrationMap, setCalibrationMap] = useState<CalibrationMap>(DEFAULT_CALIBRATION_MAP);

  // UI Settings
  const [avatarScale, setAvatarScale] = useState(1);

  // Filter Settings
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<WovRarity | "ALL">("ALL");
  const [gridColumns, setGridColumns] = useState(4);
  const [sortBy, setSortBy] = useState<"DEFAULT" | "LEGENDARY">("DEFAULT");

  // ── Data Fetch ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function initData() {
      try {
        setLoading(true);
        setError(null);

        const [rolesRaw, directItemsRaw, setsRaw, bundlesRaw, bgsRaw, offersRaw, calendarsRaw, roleIconsRaw, rankedSeasonRaw, leaderboardRaw, highscoresRaw] = await Promise.all([
          WovEngine.getRoles(),
          WovEngine.getAvatarItems(),
          WovEngine.getAvatarSets(),
          WovEngine.getBundles(),
          WovEngine.getBackgrounds(),
          WovEngine.getShopActiveOffers(),
          WovEngine.getCalendars(),
          WovEngine.getRoleIcons(),
          WovEngine.getRankedSeason(),
          WovEngine.getRankedLeaderboard(),
          WovEngine.getHighscores(),
        ]);

        if (cancelled) return;

        console.log(`[WovContext] Roles received: ${Array.isArray(rolesRaw) ? rolesRaw.length : 'Not Array'}`);

        console.log(`[WovContext] Bundles received type: ${typeof bundlesRaw}, isArray: ${Array.isArray(bundlesRaw)}`);
        if (bundlesRaw && Array.isArray(bundlesRaw) && bundlesRaw.length > 0) {
          console.log('[WovContext] 🔍 RAW API BUNDLE (First):', bundlesRaw[0]);
        } else if (bundlesRaw) {
          console.log('[WovContext] 🔍 RAW API BUNDLE (Object?):', bundlesRaw);
        }

        console.log(`[WovContext] Offers received: ${Array.isArray(offersRaw) ? offersRaw.length : 'Not Array'}`);
        if (offersRaw && offersRaw.length > 0) console.log('[WovContext] 🔍 RAW OFFER (First):', offersRaw[0]);

        console.log(`[WovContext] Calendars received: ${Array.isArray(calendarsRaw) ? calendarsRaw.length : 'Not Array'}`);
        if (calendarsRaw && calendarsRaw.length > 0) console.log('[WovContext] 🔍 RAW CALENDAR (First):', calendarsRaw[0]);

        console.log(`[WovContext] Role Icons received: ${Array.isArray(roleIconsRaw) ? roleIconsRaw.length : 'Not Array'}`);
        setRoleIcons(Array.isArray(roleIconsRaw) ? roleIconsRaw : []);

        // Ranked Data
        console.log(`[WovContext] Season:`, rankedSeasonRaw ? 'Loaded' : 'Null');
        console.log(`[WovContext] Leaderboard:`, Array.isArray(leaderboardRaw) ? leaderboardRaw.length : 'Invalid');
        console.log(`[WovContext] Highscores:`, Array.isArray(highscoresRaw) ? highscoresRaw.length : 'Invalid');

        setRankedSeason(rankedSeasonRaw);
        setLeaderboard(Array.isArray(leaderboardRaw) ? leaderboardRaw : []);
        setHighscores(Array.isArray(highscoresRaw) ? highscoresRaw : []);

        setRoles(Array.isArray(rolesRaw) ? rolesRaw : []);

        // Deduplicate offers by ID to prevent "unique key prop" errors
        const uniqueOffers = Array.isArray(offersRaw)
          ? Array.from(new Map(offersRaw.map((o, index) => {
            // Ensure we have a valid ID. If missing, generate one based on index and random string
            // AND include it in the object itself so it's available for key={offer.id}
            const safeId = o.id || `generated-offer-${index}-${Math.random().toString(36).substr(2, 9)}`;
            const safeOffer = { ...o, id: safeId };
            return [safeId, safeOffer];
          })).values())
          : [];
        setActiveOffers(uniqueOffers);

        setCalendars(Array.isArray(calendarsRaw) ? calendarsRaw : []);

        // Extract Sets from Offers
        const offerSets: WovAvatarSet[] = [];
        if (Array.isArray(offersRaw)) {
          offersRaw.forEach(offer => {
            if (offer.avatarItemSets && Array.isArray(offer.avatarItemSets)) {
              offerSets.push(...offer.avatarItemSets);
            }
            // Check for other potential set locations in offer structure if needed
          });
        }

        // Extract Items/Sets from Calendars (if structure supports it, currently speculative)
        // Calendars usually give items daily, might need more complex parsing if they contain full set objects.
        // For now, let's assume they might contain references.

        // Merge sets and bundles and offerSets
        const combinedSets = [
          ...(Array.isArray(setsRaw) ? setsRaw : []),
          ...(Array.isArray(bundlesRaw) ? bundlesRaw : []),
          ...offerSets
        ];
        // Deduplicate sets by ID just in case
        const uniqueSets = Array.from(new Map(combinedSets.map(s => [s.id, s])).values());

        setSets(uniqueSets);
        setBackgrounds(Array.isArray(bgsRaw) ? bgsRaw : []);

        // ── Build item list ────────────────────────────────
        const directItems = normaliseItems(directItemsRaw);

        // DEBUG: Log Raw API Item Structure
        if (directItems.length > 0) {
          console.log('[WovContext] 🔍 RAW API ITEM (First):', directItems[0]);
        } else if (uniqueSets.length > 0) {
          console.log('[WovContext] 🔍 RAW API SET (First):', uniqueSets[0]);
        }

        let finalItems: WovAvatarItem[];

        if (directItems.length > 0) {
          console.log(`[WovContext] ✅ Direct items: ${directItems.length}`);
          finalItems = enrichAndResolve(directItems);
        } else {
          console.log(`[WovContext] ⚠️  Direct items empty – falling back to sets extraction`);
          const fromSets = buildItemsFromSets(uniqueSets);
          console.log(`[WovContext] ✅ Items from sets: ${fromSets.length}`);
          finalItems = enrichAndResolve(fromSets);
        }

        console.log(`[WovContext] 🎯 Total items ready for grid: ${finalItems.length}`);
        const withoutSkin = finalItems.filter(i => i.type !== "SKIN");
        setItems(withoutSkin);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[WovContext] Init failed:", msg);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initData();
    return () => { cancelled = true; };
  }, []);

  // ── Wardrobe persistence ───────────────────────────────────
  // FIX #3 – localStorage guard (SSR / Next.js static export)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("wov_wardrobe");
      if (saved) setEquippedItems(JSON.parse(saved));
    } catch {
      // ignore corrupt data
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("wov_wardrobe", JSON.stringify(equippedItems));
    } catch {
      // ignore quota errors
    }
  }, [equippedItems]);

  // ── Calibration Persistence ──────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("wov_calibration");
      if (saved) setCalibrationMap(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("wov_calibration", JSON.stringify(calibrationMap));
    } catch {
      // ignore
    }
  }, [calibrationMap]);

  const updateCalibration = useCallback((category: WovCategory, density: WovDensity, data: Partial<CalibrationData>) => {
    setCalibrationMap(prev => {
      const categoryMap = prev[category] || {};
      const currentData = categoryMap[density] || { ...DEFAULT_CALIBRATION };

      return {
        ...prev,
        [category]: {
          ...categoryMap,
          [density]: {
            ...currentData,
            ...data
          }
        }
      };
    });
  }, []);

  const batchUpdateCalibration = useCallback((updates: CalibrationMap) => {
    setCalibrationMap((prev) => {
      const next = { ...prev };
      (Object.keys(updates) as WovCategory[]).forEach((category) => {
        const catUpdates = updates[category];
        if (catUpdates) {
          next[category] = { ...(next[category] || {}) };
          (Object.keys(catUpdates) as WovDensity[]).forEach((density) => {
            const data = catUpdates[density];
            if (data) {
              next[category]![density] = {
                ...(next[category]![density] || DEFAULT_CALIBRATION),
                ...data,
              };
            }
          });
        }
      });
      return next;
    });
  }, []);

  const resetCalibration = useCallback(() => {
    setCalibrationMap(DEFAULT_CALIBRATION_MAP);
    localStorage.removeItem("wov_calibration");
  }, []);

  // ── Wardrobe Actions ───────────────────────────────────────
  const equipItem = useCallback((item: WovAvatarItem) => {
    setEquippedItems((prev) => ({ ...prev, [item.type]: item }));
  }, []);

  const equipSet = useCallback((set: WovAvatarSet) => {
    setEquippedItems((prev) => {
      // Logic "O quel set o l'altro" (Exclusive Set Logic)
      // 1. Start with a clean slate, BUT preserve essential body parts (Skin, Eyes, Mouth)
      //    to avoid the avatar disappearing if the set is partial (e.g. just clothes).
      //    Everything else (Mask, Hat, Shirt, etc.) is removed.
      const next: Record<string, WovAvatarItem> = {};

      if (prev["SKIN"]) next["SKIN"] = prev["SKIN"];
      if (prev["EYES"]) next["EYES"] = prev["EYES"];
      if (prev["MOUTH"]) next["MOUTH"] = prev["MOUTH"];

      // Helper to find full item details
      // We search in the already loaded 'items' array which contains enriched data
      const findItem = (id: string) => items.find(i => i.id === id);

      const processItem = (item: WovAvatarItem) => {
        // Resolve full details if possible
        let fullItem = findItem(item.id);

        // If not found in global list, try to use the item data from the set itself
        if (!fullItem) {
          const enriched = enrichAndResolve([item])[0];
          fullItem = enriched;
        }

        if (fullItem && fullItem.type && fullItem.type !== "SET") {
          next[fullItem.type] = fullItem;
        }
      };

      // Handle 'items' array (objects)
      if (set.items && Array.isArray(set.items)) {
        set.items.forEach(processItem);
      }

      // Handle 'avatarItemIds' array (strings)
      if (set.avatarItemIds && Array.isArray(set.avatarItemIds)) {
        set.avatarItemIds.forEach(id => {
          const found = findItem(id);
          if (found) {
            next[found.type] = found;
          } else {
            // Fallback if we only have ID: we can't do much without fetching, 
            // but we can try to enrich a stub
            // However, 'items' should contain everything.
            console.warn(`[WovContext] Item ID ${id} from set not found in global items.`);
          }
        });
      }

      return next;
    });
  }, [items]);

  const unequipItem = useCallback((type: string) => {
    setEquippedItems((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  }, []);

  const clearWardrobe = useCallback(() => setEquippedItems({}), []);

  const isEquipped = useCallback(
    (itemId: string) => Object.values(equippedItems).some((i) => i.id === itemId),
    [equippedItems]
  );

  return (
    <WolvesvilleContext.Provider
      value={{
        roles,
        items,
        sets,
        backgrounds,
        activeOffers,
        calendars,
        roleIcons,
        rankedSeason,
        leaderboard,
        highscores,
        loading,
        error,

        // Wardrobe
        equippedItems,
        equipItem,
        equipSet,
        unequipItem,
        clearWardrobe,
        isEquipped,

        // Calibration
        calibrationMap,
        updateCalibration,
        batchUpdateCalibration,
        resetCalibration,

        // UI Settings
        avatarScale,
        setAvatarScale,

        // Filter Settings
        searchTerm,
        setSearchTerm,
        selectedRarity,
        setSelectedRarity,
        gridColumns,
        setGridColumns,
        sortBy,
        setSortBy
      }}
    >
      {children}
    </WolvesvilleContext.Provider>
  );
}

// ─────────────────────────────────────────────
//  HOOKS
// ─────────────────────────────────────────────

export function useWolvesville() {
  const ctx = useContext(WolvesvilleContext);
  if (!ctx) throw new Error("useWolvesville must be used within WolvesvilleProvider");
  return ctx;
}

// Alias mantenuto per retrocompatibilità con i componenti esistenti
export const useWardrobe = useWolvesville;
