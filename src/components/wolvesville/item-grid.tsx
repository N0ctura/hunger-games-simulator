"use client";

import { WovAvatarItem, WovCategory, WovRarity, WovDensity, WovAvatarSet } from "@/lib/wolvesville-types";
import { useWardrobe } from "@/context/wolvesville-context";
import { Check, Loader2, Search, X, Filter, Settings, SlidersHorizontal, ChevronRight, Menu, History } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { getCdnUrl } from "@/lib/wov-mapping";
import { getDensity } from "@/lib/utils";

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

const CATEGORIES: Array<WovCategory | "ALL"> = [
  "ALL", "SET", "HAIR", "HAT", "EYES", "MOUTH", "GLASSES",
  "SHIRT", "MASK", "BACK", "FRONT"
];

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "🗺",
  SET: "🎁",
  HAIR: "👩‍🦰",
  HAT: "🧢",
  EYES: "👀",
  MOUTH: "👄",
  GLASSES: "👓",
  SHIRT: "👕",
  MASK: "🎭",
  BACK: "🌇",
  FRONT: "🌆"
};

const RARITIES: Array<WovRarity | "ALL"> = [
  "ALL", "COMMON", "RARE", "EPIC", "LEGENDARY"
];

const COLORS = [
  "Red", "Blue", "Green", "Pink", "Purple", "Yellow", "Orange",
  "Black", "White", "Brown", "Grey", "Cyan", "Magenta", "Lime",
  "Teal", "Indigo", "Violet", "Gold", "Silver", "Bronze"
];

const ORIGINS = [
  { label: "Gold Shop", value: "SHOP_GOLD" },
  { label: "Gem Shop", value: "SHOP_GEM" },
  { label: "Battle Pass", value: "BATTLE_PASS" },
  { label: "Bundle", value: "BUNDLE" },
  { label: "Rose Wheel", value: "ROSE_WHEEL" },
  { label: "Loot Box", value: "LOOT_BOX" },
  { label: "Ranked", value: "RANKED" },
  { label: "Clan Quest", value: "CLAN_QUEST" },
  { label: "Daily Reward", value: "DAILY_REWARD" },
  { label: "Unknown / Other", value: "UNKNOWN" }
];

const RARITY_COLORS: Record<WovRarity, string> = {
  COMMON: "text-gray-400 border-gray-500/30 bg-gray-500/10",
  RARE: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  EPIC: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  LEGENDARY: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  MYTHICAL: "text-pink-400 border-pink-500/30 bg-pink-500/10",
  MYTHIC: "text-pink-400 border-pink-500/30 bg-pink-500/10",
};

const RARITY_BORDER_COLORS: Record<WovRarity, string> = {
  COMMON: "border-gray-500/50 hover:border-gray-400",
  RARE: "border-blue-500/50 hover:border-blue-400",
  EPIC: "border-purple-500/50 hover:border-purple-400",
  LEGENDARY: "border-yellow-500/50 hover:border-yellow-400",
  MYTHICAL: "border-pink-500/50 hover:border-pink-400",
  MYTHIC: "border-pink-500/50 hover:border-pink-400",
};

const PREVIEW_PRIORITY: Record<string, number> = {
  "FRONT": 1,
  "SHIRT": 2,
  "HAT": 3,
  "BACK": 4,
  "MASK": 5,
  "HAIR": 6,
  "GLASSES": 7,
  "MOUTH": 8,
  "EYES": 9,
  "GRAVESTONE": 10,
  "EMOJI": 11,
  "SKIN": 99,
  "BODY": 99,
  "HEAD": 99
};

// Dimensioni base per calcolo aspect ratio
const BASE_CELL_W = 160;
const BASE_CELL_H = 210;
const ASPECT_RATIO = BASE_CELL_H / BASE_CELL_W; // ~1.3125

// ─────────────────────────────────────────────
//  ROBUST IMAGE – 5 fallback CDN progressivi
// ─────────────────────────────────────────────

const CDN_FALLBACKS = (item: any) => {
  // Minimal fallback logic - rely on API first
  const paths = new Set<string>();

  // If API provided a URL, we trust it (handled in RobustImage)
  // These are just emergency fallbacks if the main URL fails
  const id = String(item.id).trim();
  const slug = item.imageKey || item.iconUrl || item.name?.replace(/\s+/g, '-') || id;
  const safeSlug = String(slug).trim();

  // Try standard CDN paths as backup
  paths.add(`https://cdn.wolvesville.com/avatarItems/${id}.png`);
  paths.add(`https://cdn.wolvesville.com/avatarItems/${id}@2x.png`);

  if (safeSlug !== id) {
    paths.add(`https://cdn.wolvesville.com/avatarItems/${safeSlug}.png`);
  }

  return Array.from(paths);
};

const RobustImage = memo(function RobustImage({
  item,
}: {
  item: WovAvatarItem;
}) {
  // Handle pure color items (e.g. Skins)
  if (item.imageUrl && item.imageUrl.startsWith("color:")) {
    return (
      <div
        className="w-full h-full rounded-full border border-white/20 shadow-inner"
        style={{ backgroundColor: item.imageUrl.replace("color:", "") }}
      />
    );
  }

  const urls = useMemo(() => {
    // 0. Try Local Asset first (User request)
    const localUrl = `/assets/items/${item.id}.png`;

    // 1. Trust API URL
    const apiUrls = item.imageUrl && !item.imageUrl.includes("dicebear") ? [item.imageUrl] : [];

    // 2. Add fallback image (e.g. from Set's first item)
    if ((item as any)._fallbackImage) {
      apiUrls.push((item as any)._fallbackImage);
    }

    // 3. Add minimal fallbacks
    const fallbackUrls = CDN_FALLBACKS(item);

    return [localUrl, ...apiUrls, ...fallbackUrls.filter(u => !apiUrls.includes(u))];
  }, [item]);

  const [idx, setIdx] = useState(0);

  const onErr = useCallback(() => {
    // console.warn(`[Image Fail] ${item.id} -> ${urls[idx]}`);
    setIdx(p => p + 1);
  }, [item.id, urls, idx]);

  if (idx >= urls.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs bg-white/5 rounded">
        ?
      </div>
    );
  }
  return (
    <Image
      key={urls[idx]}
      src={urls[idx]}
      alt={item.name || item.id}
      fill
      loading="lazy"
      className="object-contain"
      sizes="140px"
      onError={onErr}
      unoptimized
    />
  );
});

// ─────────────────────────────────────────────
//  ITEM CARD
// ─────────────────────────────────────────────

const ItemCard = memo(function ItemCard({
  item, equipped, onEquip, cellW, cellH
}: {
  item: WovAvatarItem;
  equipped: boolean;
  onEquip: (i: WovAvatarItem) => void;
  cellW: number;
  cellH: number;
}) {
  return (
    <div
      onClick={() => onEquip(item)}
      style={{ width: cellW - 8, height: cellH - 8 }}
      className={[
        "relative flex flex-col items-center rounded-lg p-2 transition-all cursor-pointer select-none group",
        equipped
          ? `border-2 bg-primary/10 shadow-[0_0_12px_rgba(255,255,255,0.3)] ${RARITY_BORDER_COLORS[item.rarity] || "border-white/50"}`
          : `border bg-black/20 hover:bg-black/30 ${RARITY_BORDER_COLORS[item.rarity] || "border-white/10"}`,
      ].join(" ")}
    >
      <div className="relative w-full flex-1 mb-1">
        <RobustImage item={item} />
        {equipped && (
          <div className="absolute top-0 right-0 bg-primary rounded-full p-0.5 z-10">
            <Check size={9} className="text-primary-foreground" />
          </div>
        )}
      </div>
      {/* <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded border mb-0.5 ${RARITY_COLORS[item.rarity] ?? "text-gray-400"}`}>
        {item.rarity}
      </span>
      <div className="text-[10px] text-center text-white/60 truncate w-full leading-tight">
        {item.name ?? item.id}
      </div> */}
    </div>
  );
});

// ─────────────────────────────────────────────
//  VIRTUAL GRID – implementazione custom senza dipendenze esterne
//
//  Funzionamento:
//  1. Il container ha altezza fissa con overflow-y: scroll
//  2. Un div interno ha l'altezza totale di tutte le righe (spacer)
//  3. onScroll calcoliamo quale riga è visibile
//  4. Renderizziamo solo le righe visibili + overscan
//  5. Le righe visibili sono posizionate con position:absolute + top calcolato
// ─────────────────────────────────────────────

const OVERSCAN = 3; // righe extra sopra/sotto il viewport

function VirtualGrid({
  items, isEquipped, equipItem, columns
}: {
  items: WovAvatarItem[];
  isEquipped: (id: string) => boolean;
  equipItem: (item: WovAvatarItem) => void;
  columns?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerH, setContainerH] = useState(600);
  const [containerW, setContainerW] = useState(800);

  // Misura il container con ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerH(entry.contentRect.height);
      setContainerW(entry.contentRect.width);
    });
    ro.observe(el);
    // Lettura iniziale
    setContainerH(el.clientHeight);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const manualCols = typeof columns === 'number' ? Math.max(2, Math.min(columns, 10)) : undefined;
  const colCount = manualCols ?? Math.max(1, Math.floor(containerW / BASE_CELL_W));
  const cellW = Math.floor(containerW / colCount);
  // Calcolo altezza dinamica mantenendo l'aspect ratio
  const cellH = Math.floor(cellW * ASPECT_RATIO);

  const rowCount = Math.ceil(items.length / colCount);
  const totalH = rowCount * cellH;

  const firstRow = Math.max(0, Math.floor(scrollTop / cellH) - OVERSCAN);
  const lastRow = Math.min(rowCount - 1, Math.ceil((scrollTop + containerH) / cellH) + OVERSCAN);

  const visibleRows = [];
  for (let r = firstRow; r <= lastRow; r++) {
    visibleRows.push(r);
  }

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="overflow-y-auto overflow-x-hidden w-full h-full"
      style={{ position: "relative" }}
    >
      {/* Spacer – dà l'altezza totale alla scrollbar */}
      <div style={{ height: totalH, position: "relative" }}>
        {visibleRows.map(rowIdx => {
          const top = rowIdx * cellH;
          return (
            <div
              key={rowIdx}
              style={{
                position: "absolute",
                top,
                left: 0,
                right: 0,
                height: cellH,
                display: "flex",
                gap: 8,
                padding: "4px 0",
              }}
            >
              {Array.from({ length: colCount }).map((_, colIdx) => {
                const idx = rowIdx * colCount + colIdx;
                if (idx >= items.length) return (
                  <div key={colIdx} style={{ width: cellW - 8 }} />
                );
                const item = items[idx];
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    equipped={isEquipped(item.id)}
                    onEquip={equipItem}
                    cellW={cellW}
                    cellH={cellH}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────

interface ItemGridProps {
  items: WovAvatarItem[];
  loading?: boolean;
}

export function ItemGrid({ items, loading }: ItemGridProps) {
  const {
    equipItem, equipSet, isEquipped, sets,
    searchTerm, selectedRarity, gridColumns: columns, sortBy,
    recentItems, addToRecents, equippedItems, genderMode
  } = useWardrobe();

  const [selectedCategory, setSelectedCategory] = useState<WovCategory | "ALL">("ALL");
  const [showRecents, setShowRecents] = useState(false);

  // Create a lookup map for items to efficiently find set contents
  const itemMap = useMemo(() => {
    const map = new Map<string, WovAvatarItem>();
    items.forEach(i => map.set(i.id, i));
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result: WovAvatarItem[] = [];

    // 1. BASE FILTERING (Category + Search)
    if (selectedCategory === "SET") {
      result = sets
        .filter(s => {
          if (term && !s.name.toLowerCase().includes(term)) return false;
          return true;
        })
        .map(s => {
          // Determine the best fallback image from the set's contents
          let firstItemUrl = "";

          // Strategy 1: Look for a "Representative Item" in the set (e.g. Shirt/Hat)
          // instead of just taking the first one (which might be a skin color without image)
          if (s.avatarItemIds && s.avatarItemIds.length > 0) {
            const candidates = s.avatarItemIds
              .map(id => itemMap.get(id))
              .filter((i): i is WovAvatarItem => !!i && !!i.imageUrl);

            if (candidates.length > 0) {
              // Sort by visual priority (Shirt > Hat > ... > Skin)
              candidates.sort((a, b) => {
                const pA = PREVIEW_PRIORITY[a.type] || 50;
                const pB = PREVIEW_PRIORITY[b.type] || 50;
                return pA - pB;
              });
              firstItemUrl = candidates[0].imageUrl;
            }
          }

          // Strategy 2: Fallback to original logic if Strategy 1 failed
          if (!firstItemUrl) {
            firstItemUrl =
              (s.items && s.items.length > 0 && s.items[0].imageUrl)
              || (s.avatarItemIds && s.avatarItemIds.length > 0 && getCdnUrl(s.avatarItemIds[0], "avatar"))
              || (s.avatarItemSets && s.avatarItemSets.length > 0 && getCdnUrl(s.avatarItemSets[0], "set"))
              || "";
          }

          return {
            id: s.id,
            name: s.name,
            type: "SET",
            rarity: "COMMON",
            // Primary Image: Promo > Store Set Image
            imageUrl: s.promoImageUrl || getCdnUrl(s.id, "set"),
            // Fallback Image: Representative item from the set
            _fallbackImage: firstItemUrl,
            _originalSet: s
          } as unknown as WovAvatarItem;
        });
    } else {
      result = items.filter(item => {
        if (selectedCategory !== "ALL" && item.type !== selectedCategory) return false;
        if (selectedRarity !== "ALL" && item.rarity !== selectedRarity) return false;

        // GENDER FILTER: Show only items matching current gender mode or unisex (undefined)
        if (item.gender && item.gender !== genderMode) return false;

        if (term && !(
          item.id.toLowerCase().includes(term) ||
          (item.name ?? "").toLowerCase().includes(term)
        )) return false;
        return true;
      });
    }

    // 2. SORTING
    if (sortBy === "LEGENDARY") {
      const rarityRank: Record<string, number> = { MYTHICAL: 6, MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
      result.sort((a, b) => (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0));
    }

    return result;
  }, [items, sets, searchTerm, selectedCategory, selectedRarity, sortBy, itemMap, genderMode]);

  const handleEquip = useCallback((item: WovAvatarItem) => {
    // Save current item to recents if we are swapping a single item
    if (item.type !== "SET") {
      const currentItem = equippedItems[item.type];
      if (currentItem && currentItem.id !== item.id) {
        addToRecents(currentItem);
      }
    }

    if (item.type === "SET" && (item as any)._originalSet) {
      const originalSet = (item as any)._originalSet as WovAvatarSet;

      // Resolve all items from the set (items + avatarItemIds)
      // This is crucial because some sets only have IDs or partial item lists
      const resolvedItems: WovAvatarItem[] = [];

      // 1. From .items
      if (originalSet.items) {
        resolvedItems.push(...originalSet.items);
      }

      // 2. From .avatarItemIds
      if (originalSet.avatarItemIds) {
        originalSet.avatarItemIds.forEach(id => {
          const found = itemMap.get(id);
          if (found) resolvedItems.push(found);
        });
      }

      // Equip the resolved set directly (No gender filtering)
      equipSet({
        ...originalSet,
        items: resolvedItems,
        avatarItemIds: [], // Clear IDs since we resolved them
      });

    } else {
      equipItem(item);
    }
  }, [equipItem, equipSet, itemMap, equippedItems, addToRecents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-3">
        <Loader2 className="animate-spin" size={20} />
        <span>Caricamento oggetti...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative" style={{ height: "calc(100vh - 180px)", minHeight: 400 }}>

      {/* ── Filtri & Categorie ─────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 mb-2 relative z-30">

        {/* Categories List (Scrollable) */}
        <div className="flex-1 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar scrollbar-hide select-none flex gap-1.5 md:gap-2">
          {/* Recent Items Button */}
          <button
            onClick={() => setShowRecents(true)}
            className="whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all border shrink-0 tap-target bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-300 flex items-center gap-1.5"
            title="Oggetti Recenti"
          >
            <History size={14} />
            Recenti
          </button>

          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all border shrink-0 tap-target ${selectedCategory === c
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                : "bg-black/20 text-muted-foreground border-white/5 hover:bg-black/40 hover:text-foreground hover:border-white/20"
                }`}
            >
              {CATEGORY_LABELS[c] || c}
            </button>
          ))}
        </div>

      </div>


      {/* ── Griglia virtualizzata ───────────────── */}
      {
        filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Nessun oggetto corrisponde ai filtri
          </div>
        ) : (
          <div className="flex-1 overflow-hidden rounded-xl border border-white/5">
            <VirtualGrid
              items={filtered}
              isEquipped={selectedCategory === "SET" ? () => false : isEquipped}
              equipItem={handleEquip}
              columns={columns}
            />
          </div>
        )
      }

      {/* Recent Items Overlay */}
      {showRecents && (
        <div className="absolute inset-0 z-50 bg-[#121212] flex flex-col animate-in fade-in zoom-in-95 duration-200 rounded-xl overflow-hidden border border-white/10 m-2 shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 shrink-0">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <History size={18} />
              <span className="text-sm">Oggetti Recenti</span>
            </div>
            <button
              onClick={() => setShowRecents(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {recentItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-50">
                <History size={40} />
                <p className="text-sm">Nessun oggetto recente</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                {recentItems.map((item) => {
                  const isEquippedItem = equippedItems[item.type]?.id === item.id;
                  return (
                    <div
                      key={`recent-${item.id}`}
                      className={`relative aspect-square bg-black/40 rounded-xl border p-1 group cursor-pointer transition-all tap-target ${isEquippedItem ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "border-white/10 hover:border-purple-500/50 hover:bg-white/5"
                        }`}
                      onClick={() => {
                        handleEquip(item);
                      }}
                      title={item.name}
                    >
                      <div className="relative w-full h-full p-1.5">
                        <RobustImage item={item} />
                      </div>
                      {isEquippedItem && (
                        <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-0.5 shadow-lg z-10">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div >
  );
}
