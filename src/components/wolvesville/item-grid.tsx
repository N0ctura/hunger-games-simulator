"use client";

import { WovAvatarItem, WovCategory, WovRarity } from "@/lib/wolvesville-types";
import { useWardrobe } from "@/context/wolvesville-context";
import { Check, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { getCdnUrl } from "@/lib/wov-mapping";

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

const CATEGORIES: Array<WovCategory | "ALL"> = [
  "ALL", "SET", "HAIR", "HAT", "EYES", "MOUTH", "GLASSES",
  "SHIRT", "MASK", "BACK", "FRONT", "GRAVESTONE", "SKIN"
];

const RARITIES: Array<WovRarity | "ALL"> = [
  "ALL", "COMMON", "RARE", "EPIC", "LEGENDARY",
];

const RARITY_COLORS: Record<WovRarity, string> = {
  COMMON: "text-gray-400 border-gray-500/30 bg-gray-500/10",
  RARE: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  EPIC: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  LEGENDARY: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
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
  item, equipped, onEquip,
}: { item: WovAvatarItem; equipped: boolean; onEquip: (i: WovAvatarItem) => void }) {
  return (
    <div
      onClick={() => onEquip(item)}
      style={{ width: CELL_W - 8, height: CELL_H - 8 }}
      className={[
        "flex flex-col items-center rounded-lg p-2 border transition-all cursor-pointer select-none",
        equipped
          ? "border-primary/70 bg-primary/10 shadow-[0_0_12px_hsl(43_90%_55%/0.3)]"
          : "border-white/10 bg-black/20 hover:border-primary/40 hover:bg-black/30",
      ].join(" ")}
    >
      <div className="relative w-full flex-1 mb-1">
        <RobustImage item={item} />
        {equipped && (
          <div className="absolute top-0 right-0 bg-primary rounded-full p-0.5">
            <Check size={9} className="text-primary-foreground" />
          </div>
        )}
      </div>
      <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded border mb-0.5 ${RARITY_COLORS[item.rarity] ?? "text-gray-400"}`}>
        {item.rarity}
      </span>
      <div className="text-[10px] text-center text-white/60 truncate w-full leading-tight">
        {item.name ?? item.id}
      </div>
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
  items, isEquipped, equipItem,
}: {
  items: WovAvatarItem[];
  isEquipped: (id: string) => boolean;
  equipItem: (item: WovAvatarItem) => void;
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

  const colCount = Math.max(1, Math.floor(containerW / CELL_W));
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
                  <div key={colIdx} style={{ width: CELL_W - 8 }} />
                );
                const item = items[idx];
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    equipped={isEquipped(item.id)}
                    onEquip={equipItem}
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

  // Debug: Print sample item structure
  useEffect(() => {
    if (items.length > 0) {
      console.log('Sample Item Structure:', items[0]);
    }
  }, [items]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WovCategory | "ALL">("ALL");
  const [selectedRarity, setSelectedRarity] = useState<WovRarity | "ALL">("ALL");

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // SPECIAL HANDLING FOR SETS
    if (selectedCategory === "SET") {
      return sets
        .filter(s => {
          if (term && !s.name.toLowerCase().includes(term)) return false;
          return true;
        })
        .map(s => {
          // Determine the best fallback image from the set's contents
          // 1. Try first item object
          // 2. Try first item ID (resolved to CDN)
          // 3. Try first nested set ID (resolved to CDN)
          const firstItemUrl = 
            (s.items && s.items.length > 0 && s.items[0].imageUrl) 
            || (s.avatarItemIds && s.avatarItemIds.length > 0 && getCdnUrl(s.avatarItemIds[0], "avatar"))
            || (s.avatarItemSets && s.avatarItemSets.length > 0 && getCdnUrl(s.avatarItemSets[0], "set"))
            || "";

          return {
            id: s.id,
            name: s.name,
            type: "SET",
            rarity: "COMMON",
            // Primary Image: Promo > Store Set Image
            imageUrl: s.promoImageUrl || getCdnUrl(s.id, "set"),
            // Fallback Image: First item in the set (if set image fails)
            _fallbackImage: firstItemUrl,
            _originalSet: s
          } as unknown as WovAvatarItem;
        });
    }

    return items.filter(item => {
      if (selectedCategory !== "ALL" && item.type !== selectedCategory) return false;
      if (selectedRarity !== "ALL" && item.rarity !== selectedRarity) return false;
      if (term && !(
        item.id.toLowerCase().includes(term) ||
        (item.name ?? "").toLowerCase().includes(term)
      )) return false;
      return true;
    });
  }, [items, sets, searchTerm, selectedCategory, selectedRarity]);

  const handleEquip = useCallback((item: WovAvatarItem) => {
    if (item.type === "SET" && (item as any)._originalSet) {
      equipSet((item as any)._originalSet);
    } else {
      equipItem(item);
    }
  }, [equipItem, equipSet]);

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

      {/* ── Filtri ─────────────────────────────── */}
      <div className="shrink-0 flex flex-col gap-4 mb-4 bg-card/40 backdrop-blur-sm border border-border/60 rounded-xl p-4 shadow-sm">

        {/* Top Row: Search & Rarity */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca oggetto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative min-w-[140px]">
            <select
              value={selectedRarity}
              onChange={e => setSelectedRarity(e.target.value as WovRarity | "ALL")}
              className="w-full appearance-none bg-black/20 border border-white/10 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-black/30 transition-colors"
            >
              {RARITIES.map(r => (
                <option key={r} value={r} className="bg-gray-900">{r === "ALL" ? "Tutte le rarità" : r}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Row: Category Pills */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categorie</span>
            <span className="text-xs text-muted-foreground font-mono bg-black/20 px-2 py-0.5 rounded">
              {filtered.length.toLocaleString()} items
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar scrollbar-hide select-none">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${selectedCategory === c
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                  : "bg-black/20 text-muted-foreground border-white/5 hover:bg-black/40 hover:text-foreground hover:border-white/20"
                  }`}
              >
                {c === "ALL" ? "TUTTI" : c === "SET" ? "🎁 SET" : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Griglia virtualizzata ───────────────── */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Nessun oggetto corrisponde ai filtri
        </div>
      ) : (
        <div className="flex-1 overflow-hidden rounded-xl border border-white/5">
          <VirtualGrid
            items={filtered}
            isEquipped={selectedCategory === "SET" ? () => false : isEquipped}
            equipItem={handleEquip}
          />
        </div>
      )}
    </div>
  );
}
