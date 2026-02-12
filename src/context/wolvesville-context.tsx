"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { WovAvatarItem, WovRole, WovBackground } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import { enrichItem } from "@/lib/item-mapper";

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────

interface WolvesvilleContextType {
  roles: WovRole[];
  items: WovAvatarItem[];
  backgrounds: WovBackground[];
  loading: boolean;
  error: string | null;

  // Wardrobe
  equippedItems: Record<string, WovAvatarItem>;
  equipItem: (item: WovAvatarItem) => void;
  unequipItem: (type: string) => void;
  clearWardrobe: () => void;
  isEquipped: (itemId: string) => boolean;
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
        type: "CLOTHES",   // will be overridden by enrichItem if mapping exists
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
  const [backgrounds, setBackgrounds] = useState<WovBackground[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [equippedItems, setEquippedItems] = useState<Record<string, WovAvatarItem>>({});

  // ── Data Fetch ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function initData() {
      try {
        setLoading(true);
        setError(null);

        const [rolesRaw, directItemsRaw, setsRaw, bgsRaw] = await Promise.all([
          WovEngine.getRoles(),
          WovEngine.getAvatarItems(),
          WovEngine.getAvatarSets(),
          WovEngine.getBackgrounds(),
        ]);

        if (cancelled) return;

        setRoles(Array.isArray(rolesRaw) ? rolesRaw : []);
        setBackgrounds(Array.isArray(bgsRaw) ? bgsRaw : []);

        // ── Build item list ────────────────────────────────
        const directItems = normaliseItems(directItemsRaw);

        let finalItems: WovAvatarItem[];

        if (directItems.length > 0) {
          console.log(`[WovContext] ✅ Direct items: ${directItems.length}`);
          finalItems = enrichAndResolve(directItems);
        } else {
          console.log(`[WovContext] ⚠️  Direct items empty – falling back to sets extraction`);
          const fromSets = buildItemsFromSets(setsRaw);
          console.log(`[WovContext] ✅ Items from sets: ${fromSets.length}`);
          finalItems = enrichAndResolve(fromSets);
        }

        console.log(`[WovContext] 🎯 Total items ready for grid: ${finalItems.length}`);
        setItems(finalItems);
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

  // ── Wardrobe actions ───────────────────────────────────────
  const equipItem = useCallback((item: WovAvatarItem) => {
    setEquippedItems((prev) => ({ ...prev, [item.type]: item }));
  }, []);

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
        backgrounds,
        loading,
        error,
        equippedItems,
        equipItem,
        unequipItem,
        clearWardrobe,
        isEquipped,
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
