"use client";

import { useWolvesville } from "@/context/wolvesville-context";
import { WovAvatarItem, WovCategory, DEFAULT_CALIBRATION, WovDensity, CalibrationMap } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import { Loader2, Trash2, Download, X, GripHorizontal, Wrench, Save, RotateCcw, Monitor, Plus, Minus, Wand2, ImageDown } from "lucide-react";
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

const CALIBRATION_CATEGORIES: WovCategory[] = [
  "HAT", "HAIR", "GLASSES", "EYES", "MOUTH", "MASK", "BEARD",
  "SHIRT",
  "BACK", "FRONT", "GRAVESTONE", "EMOJI",
  "BODY", "HEAD"
];

export function Wardrobe() {
  const { equippedItems, unequipItem, clearWardrobe, calibrationMap, updateCalibration, resetCalibration, batchUpdateCalibration, items } = useWolvesville();
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeSkinId, setActiveSkinId] = useState<string>("pale");
  const [exportScene, setExportScene] = useState(true); // Default to Scene (Card) export
  const hiddenAvatarRef = useRef<HTMLDivElement>(null);

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

  const handleGenerateUrl = async () => {
    setGenerating(true);
    const itemIds = Object.values(equippedItems).map(i => i.id);
    const url = await WovEngine.generateSharedAvatarUrl(itemIds);
    setGenerating(false);

    if (url) {
      window.open(url, "_blank");
    } else {
      alert("Impossibile generare l'avatar. Riprova più tardi.");
    }
  };

  const isEmpty = Object.keys(equippedItems).length === 0;

  // Active Calibration Data for Display
  const activeItem = equippedItems[selectedCategory];
  const activeDensity = activeItem ? getDensity(activeItem.imageUrl) : "@1";
  const activeCalib = calibrationMap[selectedCategory]?.[activeDensity] || DEFAULT_CALIBRATION;

  const isVirtualCategory = selectedCategory === "BODY" || selectedCategory === "HEAD";

  return (
    <>
      <div className="sticky top-24 bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-6 w-full">
        <div className="text-center">
          <h3 className="text-2xl font-bold font-serif gold-text mb-1">Avatar Builder</h3>
          <p className="text-xs text-muted-foreground">Crea il tuo stile unico</p>
        </div>

        {/* ─────────────────────────────────────────────
            AVATAR PREVIEW CANVAS
        ───────────────────────────────────────────── */}
        <div className="avatar-canvas-container relative inline-block shadow-2xl rounded-xl overflow-hidden w-[370px] h-[370px]">
          <AvatarCanvas
            skinId={activeSkinId}
            showMannequin={true}
            exportMode={exportScene}
            exportLayout={exportScene ? 'scene' : 'raw'}
            className={exportScene ? "bg-[#1a1a1a]" : undefined}
          />
        </div>

        {/* ─────────────────────────────────────────────
            SKIN TONE SELECTOR
        ───────────────────────────────────────────── */}
        <div className="flex gap-2 justify-center py-2 bg-black/20 px-4 rounded-full border border-white/5">
          {SKIN_TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setActiveSkinId(tone.id)}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${activeSkinId === tone.id ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "border-transparent opacity-80"
                }`}
              style={{ backgroundColor: tone.color }}
              title={tone.id}
            />
          ))}
        </div>

        {/* ─────────────────────────────────────────────
            EQUIPPED ITEMS (MINI LIST)
        ───────────────────────────────────────────── */}
        {!isEmpty && (
          <div className="w-full">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Equipaggiati ({Object.keys(equippedItems).length})</h4>
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {Object.entries(equippedItems).map(([type, item]) => {
                if (type === "SKIN") return null;

                const isSelected = isAdminMode && selectedCategory === type;

                return (
                  <div
                    key={type}
                    className={`relative aspect-square bg-black/40 rounded-lg border p-1 group cursor-pointer transition-all ${isSelected ? "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" : "border-white/10 hover:border-primary/50"
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
                      className="object-contain p-1"
                      unoptimized
                    />

                    {!isAdminMode && (
                      <div className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-lg backdrop-blur-sm">
                        <Trash2 size={14} className="text-white" />
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
        <div className="flex gap-3 w-full mt-auto pt-4 border-t border-white/5">
          <button
            onClick={clearWardrobe}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold border border-red-500/20"
            title="Svuota guardaroba"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={handleDownloadAvatar}
            disabled={isEmpty || downloading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold shadow-lg shadow-blue-500/20"
            title="Scarica Card"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <ImageDown size={16} />}
            <span>Card</span>
          </button>

          <button
            onClick={handleGenerateUrl}
            disabled={isEmpty || generating}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold shadow-lg shadow-primary/20"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span>Genera Link</span>
          </button>
        </div>
      </div>

      {/* Hidden Canvas for Export - NO LONGER USED */}

      {/* ─────────────────────────────────────────────
          ADMIN CALIBRATION PANEL (Draggable)
      ───────────────────────────────────────────── */}
      {!showDevPanel && (
        <button
          onClick={() => setShowDevPanel(true)}
          className="fixed bottom-4 right-4 bg-yellow-500 text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform z-[9999]"
          title="Open Calibration Admin"
        >
          <Wrench size={24} />
        </button>
      )}

      {showDevPanel && (
        <div
          className="fixed bg-black/90 backdrop-blur-lg border border-yellow-500/50 rounded-xl shadow-2xl z-[9999] text-xs font-mono w-80 flex flex-col"
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
