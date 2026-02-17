"use client";

import { WovAvatarItem, WovCategory, WovRarity, WovDensity, WovAvatarSet } from "@/lib/wolvesville-types";
import { useWardrobe } from "@/context/wolvesville-context";
import { Check, Loader2, Search, X, Filter, Settings, SlidersHorizontal, ChevronRight, Menu } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { getCdnUrl } from "@/lib/wov-mapping";
import { getDensity } from "@/lib/utils";

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

const CATEGORIES: Array<WovCategory | "ALL"> = [
  "ALL", "SET", "HAIR", "HAT", "EYES", "MOUTH", "GLASSES",
  "SHIRT", "MASK", "BACK", "FRONT", "GRAVESTONE"
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
  FRONT: "🌆",
  GRAVESTONE: "☠"
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

// Dimensioni celle virtualizzazione
const CELL_W = 160;
const CELL_H = 210;

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
    // 1. Trust API URL
    const apiUrls = item.imageUrl && !item.imageUrl.includes("dicebear") ? [item.imageUrl] : [];

    // 2. Add fallback image (e.g. from Set's first item)
    if ((item as any)._fallbackImage) {
      apiUrls.push((item as any)._fallbackImage);
    }

    // 3. Add minimal fallbacks
    const fallbackUrls = CDN_FALLBACKS(item);

    return [...apiUrls, ...fallbackUrls.filter(u => !apiUrls.includes(u))];
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
  item, equipped, onEquip, cellW
}: {
  item: WovAvatarItem;
  equipped: boolean;
  onEquip: (i: WovAvatarItem) => void;
  cellW: number;
}) {
  return (
    <div
      onClick={() => onEquip(item)}
      style={{ width: cellW - 8, height: CELL_H - 8 }}
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
  const colCount = manualCols ?? Math.max(1, Math.floor(containerW / CELL_W));
  const cellW = Math.floor(containerW / colCount);
  const rowCount = Math.ceil(items.length / colCount);
  const totalH = rowCount * CELL_H;

  const firstRow = Math.max(0, Math.floor(scrollTop / CELL_H) - OVERSCAN);
  const lastRow = Math.min(rowCount - 1, Math.ceil((scrollTop + containerH) / CELL_H) + OVERSCAN);

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
          const top = rowIdx * CELL_H;
          return (
            <div
              key={rowIdx}
              style={{
                position: "absolute",
                top,
                left: 0,
                right: 0,
                height: CELL_H,
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
  const { equipItem, equipSet, isEquipped, sets } = useWardrobe();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WovCategory | "ALL">("ALL");
  const [selectedRarity, setSelectedRarity] = useState<WovRarity | "ALL">("ALL");
  const [columns, setColumns] = useState<number>(4);

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [sortBy, setSortBy] = useState<"DEFAULT" | "LEGENDARY">("DEFAULT");

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
  }, [items, sets, searchTerm, selectedCategory, selectedRarity, sortBy, itemMap]);

  const handleEquip = useCallback((item: WovAvatarItem) => {
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
  }, [equipItem, equipSet, itemMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-3">
        <Loader2 className="animate-spin" size={20} />
        <span>Caricamento oggetti...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 180px)", minHeight: 400 }}>

      {/* ── Filtri & Categorie ─────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 mb-2 relative z-30">

        {/* Categories List (Scrollable) */}
        <div className="flex-1 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar scrollbar-hide select-none flex gap-1.5 md:gap-2">
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

        {/* Options Toggle */}
        <button
          onClick={() => setShowOptions(!showOptions)}
className = {`p-2 rounded-lg border transition-all tap-target shrink-0 ${showOptions
  ? "bg-primary text-primary-foreground border-primary shadow-lg"
  : "bg-card/40 border-white/10 text-muted-foreground hover:bg-card/60 hover:text-foreground"
  }`}
title = "Opzioni Filtri"
  >
  <Settings size={20} />
        </button >

  {/* Options Dropdown Panel */ }
{
  showOptions && (
    <>
      {/* Mobile Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none" onClick={() => setShowOptions(false)} />

      <div className="absolute top-12 right-0 w-[280px] md:w-[320px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95 origin-top-right z-50">

        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-1">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-primary" />
            Filtri & Opzioni
          </span>
          <button onClick={() => setShowOptions(false)}><X size={16} className="text-muted-foreground hover:text-white" /></button>
        </div>

        {/* 1. Search */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase font-bold flex justify-between">
            Cerca
            {searchTerm && <span className="text-primary text-[9px] cursor-pointer" onClick={() => setSearchTerm("")}>RESET</span>}
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Nome oggetto..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-base md:text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 text-white"
              autoFocus
            />
            {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"><X size={14} /></button>}
          </div>
        </div>

        {/* 2. Rarity */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase font-bold">Rarità</label>
          <div className="relative">
            <select
              value={selectedRarity}
              onChange={e => setSelectedRarity(e.target.value as any)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-base md:text-sm focus:outline-none focus:border-primary/50 appearance-none text-white cursor-pointer"
            >
              {RARITIES.map(r => <option key={r} value={r} className="bg-zinc-900 text-white">{r === "ALL" ? "Tutte le rarità" : r}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground pointer-events-none" size={14} />
          </div>
        </div>

        {/* 3. Columns */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-muted-foreground uppercase font-bold">Dimensione Griglia</label>
            <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white">{columns} col</span>
          </div>
          <input
            type="range" min={2} max={10} step={1}
            value={columns}
            onChange={e => setColumns(Number(e.target.value))}
            className="w-full accent-primary h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground px-1">
            <span>Grande</span>
            <span>Piccola</span>
          </div>
        </div>

        {/* 4. Sort */}
        <div className="pt-2 border-t border-white/10">
          <label className="flex items-center gap-3 cursor-pointer group p-1 rounded-lg hover:bg-white/5 transition-colors">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${sortBy === "LEGENDARY" ? "bg-primary border-primary" : "border-white/30 bg-black/40"}`}>
              {sortBy === "LEGENDARY" && <Check size={10} className="text-black font-bold" />}
            </div>
            <input type="checkbox" className="hidden" checked={sortBy === "LEGENDARY"} onChange={() => setSortBy(s => s === "LEGENDARY" ? "DEFAULT" : "LEGENDARY")} />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Mostra Leggendari prima</span>
          </label>
        </div>

        {/* Summary */}
        <div className="text-center text-[10px] text-muted-foreground pt-2 border-t border-white/5">
          {filtered.length} oggetti trovati
        </div>

      </div>
    </>
  )
}

      </div >

  {/* ── Griglia virtualizzata ───────────────── */ }
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
    </div >
  );
}
