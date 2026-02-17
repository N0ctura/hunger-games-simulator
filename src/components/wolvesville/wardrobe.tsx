"use client";

import { useWolvesville } from "@/context/wolvesville-context";
import { WovAvatarItem, WovCategory, DEFAULT_CALIBRATION, WovDensity, CalibrationMap, WovRarity } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import { Loader2, Trash2, Download, X, GripHorizontal, Wrench, Save, RotateCcw, Monitor, Plus, Minus, Wand2, ImageDown, Settings, SlidersHorizontal, Search, Check, ChevronRight, ImagePlus } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useEffect, useRef } from "react";
import { AvatarCanvas, SKIN_TONES } from "./avatar-canvas";
import { getDensity } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { analyzeImageBoundingBox, calculateAutoOffset } from "@/lib/auto-calibration";
import { toPng } from 'html-to-image';

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

const RARITIES: Array<WovRarity | "ALL"> = [
  "ALL", "COMMON", "RARE", "EPIC", "LEGENDARY"
];

const CALIBRATION_CATEGORIES: WovCategory[] = [
  "HAT", "HAIR", "GLASSES", "EYES", "MOUTH", "MASK", "BEARD",
  "SHIRT",
  "BACK", "FRONT", "GRAVESTONE", "EMOJI",
  "BODY", "HEAD"
];

export function Wardrobe() {
  const {
    equippedItems, unequipItem, clearWardrobe, calibrationMap, updateCalibration,
    resetCalibration, batchUpdateCalibration, items, equipItem,
    // Filters
    searchTerm, setSearchTerm, selectedRarity, setSelectedRarity,
    gridColumns: columns, setGridColumns: setColumns, sortBy, setSortBy
  } = useWolvesville();

  const [downloading, setDownloading] = useState(false);
  const [activeSkinId, setActiveSkinId] = useState<string>(SKIN_TONES[0].id);
  const [exportScene, setExportScene] = useState(true); // Default to Scene (Card) export
  const hiddenAvatarRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [bgColor, setBgColor] = useState<string>("#1a1a1a");
  const [bgImage, setBgImage] = useState<string | null>(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };





  const handleDownloadAvatar = async () => {
    // We will use the visible canvas directly
    const targetElement = document.querySelector('.avatar-canvas-container') as HTMLElement;

    if (!targetElement) {
      alert("Impossibile trovare l'elemento da catturare");
      return;
    }

    setDownloading(true);

    // Store original srcs to restore later
    const originalSrcs: Map<HTMLImageElement, string> = new Map();

    try {
      // 1. PRE-PROCESS: Use a CORS-friendly proxy (wsrv.nl) for all images
      // This service (images.weserv.nl) is very reliable and adds CORS headers
      const images = targetElement.querySelectorAll('img');
      console.log(`[Download] Processing ${images.length} images...`);

      // Create a promise for each image to load via proxy
      const loadPromises = Array.from(images).map(async (img) => {
        const originalSrc = img.src;
        // Skip if already data uri or local
        if (originalSrc.startsWith('data:') || originalSrc.startsWith('blob:') || originalSrc.startsWith('/')) return;

        try {
          // Use wsrv.nl as proxy to fetch the image data
          // We fetch it manually to convert to Base64, avoiding any crossOrigin issues in the DOM
          const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(originalSrc)}&output=png`;

          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error('Proxy fetch failed');

          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Store original to restore later
          originalSrcs.set(img, originalSrc);

          // Set Base64 source - no crossOrigin needed for Data URIs
          img.removeAttribute('crossorigin'); // Ensure no lingering attribute
          img.src = base64;

        } catch (e) {
          console.warn(`[Download] Failed to load image via proxy: ${originalSrc}`, e);
          // If fail, do nothing (keep original). toPng might fail to render this specific item or render it blank.
        }
      });

      await Promise.all(loadPromises);

      // Wait a tiny bit more for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. CAPTURE
      const dataUrl = await toPng(targetElement, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: true,
        backgroundColor: exportScene ? undefined : undefined,
      });

      // 3. DOWNLOAD
      const link = document.createElement('a');
      const suffix = exportScene ? 'card' : 'avatar';
      link.download = `wolvesville-${suffix}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      alert("Errore durante la creazione dello screenshot. Dettagli: " + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      // 4. CLEANUP: Restore original sources
      originalSrcs.forEach((src, img) => {
        img.src = src;
      });
      setDownloading(false);
    }
  };

  // ─────────────────────────────────────────────
  //  ADMIN / CALIBRATION STATE
  // ─────────────────────────────────────────────
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAutoCalibrating, setIsAutoCalibrating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WovCategory>("HAT");
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // ─────────────────────────────────────────────
  //  DRAGGABLE PANEL LOGIC
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        setPanelPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    const handleUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, dragOffset]);

  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - panelPos.x,
      y: e.clientY - panelPos.y
    });
  };

  // ─────────────────────────────────────────────
  //  ACTIONS
  // ─────────────────────────────────────────────

  const handleAutoCalibration = async () => {
    setIsAutoCalibrating(true);
    try {
      const targetItems = items.filter(i => i.type === selectedCategory);
      if (targetItems.length === 0) {
        console.warn("[AutoCalib] No items found for category:", selectedCategory);
        return;
      }

      console.log(`[AutoCalib] Starting analysis for ${targetItems.length} items of type ${selectedCategory}`);
      const updates: CalibrationMap = {};

      // Process in serial to prevent UI freeze and rate limits
      let count = 0;
      for (const item of targetItems) {
        if (!item.imageUrl) continue;

        try {
          const bbox = await analyzeImageBoundingBox(item.imageUrl);
          if (bbox) {
            const density = getDensity(item.imageUrl);
            const offset = calculateAutoOffset(selectedCategory, bbox, bbox.originalWidth, bbox.originalHeight);

            if (!updates[selectedCategory]) updates[selectedCategory] = {};
            // Preserve existing scale if possible, otherwise default to 1
            const currentScale = calibrationMap[selectedCategory]?.[density]?.scale ?? 1;

            updates[selectedCategory]![density] = {
              x: Number(offset.x.toFixed(1)),
              y: Number(offset.y.toFixed(1)),
              scale: currentScale,
              // We do not set scale here to preserve existing/default scale
            };
            count++;
          }
        } catch (e) {
          console.error(`[AutoCalib] Failed for item ${item.id}:`, e);
        }

        // Yield to main thread every 10 items
        if (count % 10 === 0) await new Promise(r => setTimeout(r, 0));
      }

      console.log(`[AutoCalib] Processed ${count} items.`);
      if (count > 0) {
        batchUpdateCalibration(updates);
        console.log("AUTO CALIBRATION RESULT JSON:", JSON.stringify(updates, null, 2));
        alert(`Calibrazione automatica completata per ${count} item! Controlla la console per il JSON.`);
      } else {
        alert("Nessun item analizzato con successo.");
      }

    } catch (e) {
      console.error("[AutoCalib] Error:", e);
      alert("Errore durante la calibrazione automatica.");
    } finally {
      setIsAutoCalibrating(false);
    }
  };



  const isEmpty = Object.keys(equippedItems).length === 0;

  // Active Calibration Data for Display
  const activeItem = equippedItems[selectedCategory];
  const activeDensity = activeItem ? getDensity(activeItem.imageUrl) : "@1";
  const activeCalib = calibrationMap[selectedCategory]?.[activeDensity] || DEFAULT_CALIBRATION;

  const isVirtualCategory = selectedCategory === "BODY" || selectedCategory === "HEAD";

  // ─────────────────────────────────────────────
  // CONFIGURAZIONE SCALA AVATAR
  // Modifica qui i valori per cambiare la grandezza dell'avatar
  // 0.36 = Mobile (circa 80% della grandezza originale)
  // 0.45 = Desktop (grandezza originale)
  // ─────────────────────────────────────────────
  const [avatarScale, setAvatarScale] = useState(0.45);

  // ─────────────────────────────────────────────
  // CONFIGURAZIONE SCALA CONTENITORE (Box Esterno)
  // Modifica qui i valori per cambiare la grandezza del riquadro che contiene l'avatar
  // ─────────────────────────────────────────────
  const [containerStyle, setContainerStyle] = useState({ width: '400px', height: '400px' });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;

      // 1. Imposta Scala Avatar
      setAvatarScale(isMobile ? 0.36 : 0.45);

      // 2. Imposta Dimensione Contenitore
      if (isMobile) {
        setContainerStyle({ width: '300px', height: '300px' });
      } else {
        setContainerStyle({ width: '370px', height: '370px' }); // Desktop (md) size
      }
    };

    // Set initial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <div className="sticky top-4 md:top-24 bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col items-center gap-1 md:gap-6 w-full">
        <div className="w-full flex items-center justify-between relative">
          <div className="w-10" /> {/* Spacer */}
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold font-serif gold-text mb-1">Avatar Builder By R0ck</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground">Crea il tuo stile unico</p>
          </div>

          {/* Options Button */}
          <div className="w-10 flex justify-end relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`p-2 rounded-lg border transition-all tap-target shrink-0 ${showOptions
                ? "bg-primary text-primary-foreground border-primary shadow-lg"
                : "bg-card/40 border-white/10 text-muted-foreground hover:bg-card/60 hover:text-foreground"
                }`}
              title="Opzioni Filtri"
            >
              <Settings size={20} />
            </button>

            {/* Options Dropdown Panel */}
            {showOptions && (
              <div className="absolute top-12 right-0 w-[280px] md:w-[320px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95 origin-top-right z-50 text-left">

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

                {/* Background Upload */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold">Sfondo</label>
                    {bgImage && (
                      <button
                        onClick={() => setBgImage(null)}
                        className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 size={10} /> Rimuovi
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <label
                      htmlFor="bg-upload-input"
                      className="flex-1 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all rounded-lg p-2 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-white group"
                    >
                      <ImagePlus size={16} className="group-hover:text-primary transition-colors" />
                      <span>Carica Sfondo</span>
                    </label>
                    <input
                      id="bg-upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBgUpload}
                    />
                  </div>
                  {bgImage && (
                    <div className="mt-2 relative w-full h-8 rounded-lg overflow-hidden border border-white/20 flex items-center bg-black/50">
                      <img src={bgImage} alt="Anteprima" className="h-full w-auto aspect-square object-cover" />
                      <span className="ml-2 text-[9px] text-muted-foreground truncate flex-1">Sfondo caricato</span>
                    </div>
                  )}
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
                    <input type="checkbox" className="hidden" checked={sortBy === "LEGENDARY"} onChange={() => setSortBy(sortBy === "LEGENDARY" ? "DEFAULT" : "LEGENDARY")} />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Mostra Leggendari prima</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────
            AVATAR PREVIEW CANVAS
        ───────────────────────────────────────────── */}
        <div
          className="avatar-canvas-container relative inline-block shadow-2xl rounded-xl overflow-hidden"
          style={containerStyle}
        >
          <AvatarCanvas
            skinId={activeSkinId}
            showMannequin={true}
            exportMode={exportScene}
            exportLayout={exportScene ? 'scene' : 'raw'}
            className={exportScene ? (bgImage ? "" : "bg-[#1a1a1a]") : undefined}
            backgroundColor={bgColor}
            backgroundImage={bgImage || undefined}
            showGradient={!bgColor && !bgImage}
            scale={avatarScale}
          />
        </div>

        <div className="w-full flex justify-center -mt-2">
          <button
            onClick={() => setShowDetails(v => !v)}
            className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-full border transition-all tap-target ${showDetails ? 'bg-black/30 border-white/15 text-white/80 hover:bg-black/40' : 'bg-primary/20 border-primary/40 text-primary hover:bg-primary/30'}`}
            title={showDetails ? 'Nascondi' : 'Vedi tutto'}
          >
            {showDetails ? 'Nascondi' : 'Vedi tutto'}
          </button>
        </div>

        {showDetails && (
          <div className="flex items-center gap-2 md:gap-3 bg-black/20 border border-white/10 px-2 md:px-3 py-1.5 md:py-2 rounded-lg">
            <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-wider">Colore sfondo</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-7 h-5 md:w-8 md:h-6 p-0 border border-white/20 rounded cursor-pointer bg-transparent"
              title="Scegli colore di sfondo"
            />
            <button
              onClick={() => setBgColor("#1a1a1a")}
              className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-white/10 hover:bg-white/10 tap-target"
              title="Reset"
            >
              Reset
            </button>
          </div>
        )}

        {showDetails && (
          <div className="flex gap-1.5 md:gap-2 justify-center py-1.5 md:py-2 bg-black/20 px-3 md:px-4 rounded-full border border-white/5">
            {SKIN_TONES.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setActiveSkinId(tone.id)}
                className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 transition-all hover:scale-110 tap-target ${activeSkinId === tone.id ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "border-transparent opacity-80"
                  }`}
                style={{ backgroundColor: tone.color }}
                title={tone.id}
              />
            ))}
          </div>
        )}

        {/* ─────────────────────────────────────────────
            EQUIPPED ITEMS (MINI LIST)
        ───────────────────────────────────────────── */}
        {showDetails && !isEmpty && (
          <div className="w-full">
            <h4 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">Equipaggiati ({Object.keys(equippedItems).length})</h4>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-1.5 md:gap-2 max-h-32 md:max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {Object.entries(equippedItems).map(([type, item]) => {
                if (type === "SKIN") return null;

                const isSelected = isAdminMode && selectedCategory === type;

                return (
                  <div
                    key={type}
                    className={`relative aspect-square bg-black/40 rounded-lg border p-1 group cursor-pointer transition-all tap-target ${isSelected ? "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" : "border-white/10 hover:border-primary/50"
                      }`}
                    onClick={() => {
                      if (isAdminMode) {
                        setSelectedCategory(type as WovCategory);
                      } else {
                        unequipItem(type);
                      }
                    }}
                    title={isAdminMode ? `Seleziona ${type} per calibrazione` : `Rimuovi ${item.name} (${type})`}
                  >
                    <Image
                      src={WovEngine.resolveImageUrl(item.id, "avatar", item.imageUrl)}
                      alt={type}
                      fill
                      className="object-contain p-0.5 md:p-1"
                      unoptimized
                    />

                    {!isAdminMode && (
                      <div className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-lg backdrop-blur-sm">
                        <Trash2 size={12} className="md:w-3.5 md:h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────
            ACTIONS
        ───────────────────────────────────────────── */}
        {showDetails && (
          <div className="flex gap-2 md:gap-3 w-full mt-auto pt-3 md:pt-4 border-t border-white/5">
            <button
              onClick={clearWardrobe}
              className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs md:text-sm font-bold border border-red-500/20 tap-target"
              title="Svuota guardaroba"
            >
              <Trash2 size={14} className="md:w-4 md:h-4" />
            </button>

            <button
              onClick={handleDownloadAvatar}
              disabled={isEmpty || downloading}
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs md:text-sm font-bold shadow-lg shadow-blue-500/20 tap-target"
              title="Scarica Card"
            >
              {downloading ? <Loader2 size={14} className="md:w-4 md:h-4 animate-spin" /> : <ImageDown size={14} className="md:w-4 md:h-4" />}
              <span>Card</span>
            </button>




          </div>
        )}

      </div>

      {/* Hidden Canvas for Export - NO LONGER USED */}

      {/* ─────────────────────────────────────────────
          ADMIN CALIBRATION PANEL (Draggable) - Hidden on Mobile
      ───────────────────────────────────────────── */}
      {!showDevPanel && (
        <button
          onClick={() => setShowDevPanel(true)}
          className="hidden md:block fixed bottom-4 right-4 bg-yellow-500 text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform z-[9999]"
          title="Open Calibration Admin"
        >
          <Wrench size={24} />
        </button>
      )}

      {showDevPanel && (
        <div
          className="hidden md:block fixed bg-black/90 backdrop-blur-lg border border-yellow-500/50 rounded-xl shadow-2xl z-[9999] text-xs font-mono w-80 flex flex-col"
          style={{ left: panelPos.x, top: panelPos.y }}
        >
          {/* HEADER */}
          <div
            className="flex items-center justify-between p-3 border-b border-yellow-500/30 cursor-grab active:cursor-grabbing bg-yellow-500/10 rounded-t-xl"
            onMouseDown={startDrag}
          >
            <div className="flex items-center gap-2 text-yellow-400 font-bold select-none">
              <GripHorizontal size={16} />
              <span>CALIBRAZIONE V2</span>
            </div>
            <button onClick={() => setShowDevPanel(false)} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* CONTROLS */}
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">

            {/* Mode Toggle */}
            <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
              <span className="text-gray-300 font-bold">Modalità Admin</span>
              <button
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isAdminMode ? "bg-green-500" : "bg-gray-600"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isAdminMode ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {/* Mannequin Selector (Special) */}
            {isAdminMode && (
              <div className="flex gap-2 p-2 bg-white/5 rounded-lg">
                {["BODY", "HEAD"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as WovCategory)}
                    className={`flex-1 py-1.5 px-3 rounded text-[10px] font-bold transition-all ${selectedCategory === cat
                      ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
                      : "bg-black/40 text-gray-400 hover:bg-black/60 hover:text-white"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
                {/* Auto Calibration Button */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={handleAutoCalibration}
                    disabled={isAutoCalibrating}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAutoCalibrating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    {isAutoCalibrating ? "Analisi in corso..." : `Auto-Calibra Visibili (${selectedCategory})`}
                  </button>
                  <p className="text-[9px] text-gray-500 mt-1 text-center leading-tight">
                    Analizza i pixel di tutti gli item {selectedCategory} caricati e calcola l'offset ideale.
                  </p>
                </div>
              </div>
            )}

            {isAdminMode && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="bg-yellow-500/10 p-3 rounded border border-yellow-500/20 text-yellow-200">
                  <p className="flex items-center gap-2 mb-1"><Wrench size={14} /> Strumenti Calibrazione</p>
                  <p className="text-[10px] opacity-80">Usa gli slider o i pulsanti +/- per calibrare posizione e dimensione. Precisione 0.1.</p>
                </div>

                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="text-gray-400">Categoria Selezionata</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as WovCategory)}
                    className="w-full bg-black border border-white/20 rounded p-1 text-white"
                  >
                    {CALIBRATION_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Active Item Info */}
                <div className="bg-white/5 p-3 rounded space-y-2">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="font-bold text-white">{selectedCategory}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeDensity === "@1" ? "bg-gray-500 text-white" :
                      activeDensity === "@2" ? "bg-green-500 text-black" :
                        activeDensity === "@3" ? "bg-blue-500 text-white" :
                          "bg-purple-500 text-white"
                      }`}>
                      {activeDensity}
                    </span>
                  </div>

                  {activeItem || isVirtualCategory ? (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-black/40 p-1 rounded">
                        <div className="text-gray-500 text-[10px]">X</div>
                        <div className="text-white font-mono">{activeCalib.x.toFixed(1)}</div>
                      </div>
                      <div className="bg-black/40 p-1 rounded">
                        <div className="text-gray-500 text-[10px]">Y</div>
                        <div className="text-white font-mono">{activeCalib.y.toFixed(1)}</div>
                      </div>
                      <div className="bg-black/40 p-1 rounded">
                        <div className="text-gray-500 text-[10px]">Scale</div>
                        <div className="text-white font-mono">{activeCalib.scale.toFixed(2)}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-400 italic text-center">Nessun item equipaggiato</p>
                  )}
                </div>

                {/* Advanced Controls with Sliders */}
                {(activeItem || isVirtualCategory) && (
                  <div className="space-y-4 bg-white/5 p-3 rounded-lg">
                    {/* X Control */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>X Position</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCalibration(selectedCategory, activeDensity, { x: Number((activeCalib.x - 0.1).toFixed(1)) })}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                        ><Minus size={12} /></button>
                        <Slider
                          value={[activeCalib.x]}
                          min={-1000}
                          max={1000}
                          step={0.1}
                          onValueChange={(v) => updateCalibration(selectedCategory, activeDensity, { x: v[0] })}
                          className="flex-1"
                        />
                        <button
                          onClick={() => updateCalibration(selectedCategory, activeDensity, { x: Number((activeCalib.x + 0.1).toFixed(1)) })}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                        ><Plus size={12} /></button>
                      </div>
                    </div>

                    {/* Y Control */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Y Position</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCalibration(selectedCategory, activeDensity, { y: Number((activeCalib.y - 0.1).toFixed(1)) })}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                        ><Minus size={12} /></button>
                        <Slider
                          value={[activeCalib.y]}
                          min={-10000}
                          max={10000}
                          step={0.1}
                          onValueChange={(v) => updateCalibration(selectedCategory, activeDensity, { y: v[0] })}
                          className="flex-1"
                        />
                        <button
                          onClick={() => updateCalibration(selectedCategory, activeDensity, { y: Number((activeCalib.y + 0.1).toFixed(1)) })}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                        ><Plus size={12} /></button>
                      </div>
                    </div>

                    {/* Scale Control */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Scale</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCalibration(selectedCategory, activeDensity, { scale: Number((activeCalib.scale - 0.01).toFixed(2)) })}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                        ><Minus size={12} /></button>
                        <Slider
                          value={[activeCalib.scale]}
                          min={0.1}
                          max={5}
                          step={0.01}
                          onValueChange={(v) => updateCalibration(selectedCategory, activeDensity, { scale: v[0] })}
                          className="flex-1"
                        />
                        <button
                          onClick={() => updateCalibration(selectedCategory, activeDensity, { scale: Number((activeCalib.scale + 0.01).toFixed(2)) })}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
                        ><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex gap-2">
              <button
                onClick={resetCalibration}
                className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 py-2 rounded flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 py-2 rounded flex items-center justify-center gap-2"
                onClick={() => {
                  const data = JSON.stringify(calibrationMap, null, 2);
                  navigator.clipboard.writeText(data);
                  alert("Configurazione copiata negli appunti!");
                }}
              >
                <Save size={14} /> Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
