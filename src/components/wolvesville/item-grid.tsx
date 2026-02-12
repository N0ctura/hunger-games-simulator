"use client";

import { WovAvatarItem, WovCategory, WovRarity } from "@/lib/wolvesville-types";
import { useWardrobe } from "@/context/wolvesville-context";
import { Check, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

const CATEGORIES: Array<WovCategory | "ALL"> = [
  "ALL", "HAIR", "HAT", "EYES", "MOUTH", "CLOTHES",
  "BACK", "HAND", "MASK", "GLASSES", "SHIRT", "PANTS", "SHOES",
  "NECK", "FRONT", "BEARD",
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

const CDN_FALLBACKS = (id: string) => {
  // Preserva caratteri speciali come '-' (es. Lt-...)
  const safeId = id.trim();
  
  return [
    `https://cdn.wolvesville.com/avatarItems/${safeId}.png`,
    `https://cdn.wolvesville.com/avatarItems/v2/${safeId}.png`,
    `https://cdn.wolvesville.com/inventoryItems/${safeId}.png`,
    `https://cdn.wolvesville.com/items/${safeId}.png`,
    `https://cdn.wolvesville.com/avatarItems/v2/${safeId}.store.png`,
  ];
};

const RobustImage = memo(function RobustImage({
  itemId,
  name,
  initialUrl,
}: {
  itemId: string;
  name: string;
  initialUrl?: string;
}) {
  const urls = useMemo(() => {
    const base = CDN_FALLBACKS(itemId);
    if (initialUrl && !initialUrl.includes("dicebear")) {
      return [initialUrl, ...base.filter((u) => u !== initialUrl)];
    }
    return base;
  }, [itemId, initialUrl]);

  const [idx, setIdx] = useState(0);

  const onErr = useCallback(() => {
    console.warn('[Immagine mancante]', itemId, urls[idx]);
    setIdx(p => p + 1);
  }, [itemId, urls, idx]);

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
      alt={name}
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
        <RobustImage itemId={item.id} name={item.name ?? "?"} initialUrl={item.imageUrl} />
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
  const { equipItem, isEquipped } = useWardrobe();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WovCategory | "ALL">("ALL");
  const [selectedRarity, setSelectedRarity] = useState<WovRarity | "ALL">("ALL");

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter(item => {
      if (selectedCategory !== "ALL" && item.type !== selectedCategory) return false;
      if (selectedRarity !== "ALL" && item.rarity !== selectedRarity) return false;
      if (term && !(
        item.id.toLowerCase().includes(term) ||
        (item.name ?? "").toLowerCase().includes(term)
      )) return false;
      return true;
    });
  }, [items, searchTerm, selectedCategory, selectedRarity]);

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
      <div className="shrink-0 flex flex-wrap gap-3 items-center mb-4 bg-card/20 border border-border rounded-xl p-3">

        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca per nome o ID…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value as WovCategory | "ALL")}
          className="text-sm bg-input border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === "ALL" ? "Tutte le categorie" : c}</option>
          ))}
        </select>

        <select
          value={selectedRarity}
          onChange={e => setSelectedRarity(e.target.value as WovRarity | "ALL")}
          className="text-sm bg-input border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {RARITIES.map(r => (
            <option key={r} value={r}>{r === "ALL" ? "Tutte le rarità" : r}</option>
          ))}
        </select>

        <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
          {filtered.length.toLocaleString()} / {items.length.toLocaleString()} oggetti
        </span>
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
            isEquipped={isEquipped}
            equipItem={equipItem}
          />
        </div>
      )}
    </div>
  );
}
