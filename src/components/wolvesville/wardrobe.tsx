"use client";

import { useWardrobe } from "@/context/wolvesville-context";
import { WovAvatarItem, WovCategory } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import { Loader2, Trash2, Download, X, GripHorizontal, Wrench } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";

// ─────────────────────────────────────────────
//  CONSTANTS & CONFIG
// ─────────────────────────────────────────────

const MANNEQUIN_LAYERS = {
  BODY: "https://cdn.wolvesville.com/avatarItems/body.store.png",
  HEAD: "https://cdn.wolvesville.com/avatarItems/head.store.png",
};

// Skin Tones with CSS Filters
const SKIN_TONES = [
  { id: "pale", color: "#F5D0B0", filter: "brightness(1.1) sepia(0.2) hue-rotate(-10deg)" },
  { id: "tan", color: "#E0AC69", filter: "brightness(0.95) sepia(0.4) hue-rotate(-25deg)" },
  { id: "brown", color: "#8D5524", filter: "brightness(0.7) sepia(0.6) hue-rotate(-35deg)" },
  { id: "dark", color: "#3B2219", filter: "brightness(0.5) sepia(0.5) hue-rotate(-40deg)" },
  { id: "zombie", color: "#7FA075", filter: "grayscale(1) sepia(0.5) hue-rotate(70deg) brightness(0.9) contrast(0.9)" },
];

const Z_INDEX_MAP: Record<string, number> = {
  "BACK": 5,
  "GRAVESTONE": 6,
  "BASE_BODY": 10,
  "SHIRT": 20,
  "BASE_HEAD": 30,
  "MOUTH": 31,
  "EYES": 32,
  "BEARD": 33,
  "HAIR": 40,
  "GLASSES": 45,
  "MASK": 46,
  "HAT": 50,
  "FRONT": 70,
  "EMOJI": 80,
};

const RENDER_ORDER: WovCategory[] = [
  "BACK", "GRAVESTONE", "SHIRT",
  "BEARD", "MOUTH", "EYES", "HAIR", "GLASSES", "MASK", "HAT", "FRONT", "EMOJI"
];

const CALIBRATION_CATEGORIES = [
  "HAT", "HAIR", "GLASSES", "EYES", "MOUTH", "MASK", "BEARD",
  "SHIRT",
  "BACK", "FRONT", "GRAVESTONE", "EMOJI"
];

export function Wardrobe() {
  const { equippedItems, unequipItem, clearWardrobe } = useWardrobe();
  const [generating, setGenerating] = useState(false);
  const [activeSkinId, setActiveSkinId] = useState<string>("pale");

  // DEV CONTROLS STATE
  const [devBodyBottom, setDevBodyBottom] = useState(-4);
  const [devHeadBottom, setDevHeadBottom] = useState(20);
  const [devScale, setDevScale] = useState(40);
  const [devContainerSize, setDevContainerSize] = useState(500);

  // Category specific configuration (Y-offset, X-offset, Scale-multiplier)
  const [selectedCategory, setSelectedCategory] = useState("HAT");
  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, { y: number, x: number, scale: number }>>({
    "HAT": { "y": -10, "x": 0, "scale": 100 },
    "HAIR": { "y": 18, "x": -1.5, "scale": 100 },
    "GLASSES": { "y": 14, "x": 0, "scale": 77 },
    "EYES": { "y": 17, "x": 0, "scale": 64 },
    "MOUTH": { "y": 0, "x": 0, "scale": 77 },
    "MASK": { "y": 0, "x": 0, "scale": 100 },
    "BEARD": { "y": 0, "x": 0, "scale": 100 },
    "SHIRT": { "y": -10.5, "x": 0, "scale": 75 },
    "BACK": { "y": 0, "x": 0, "scale": 100 },
    "FRONT": { "y": 0.5, "x": 18.5, "scale": 35 },
    "GRAVESTONE": { "y": 0, "x": 0, "scale": 100 },
    "EMOJI": { "y": 0, "x": 0, "scale": 100 }
  });

  // DRAGGABLE PANEL STATE
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 400, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle Dragging
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

  const activeSkin = useMemo(() =>
    SKIN_TONES.find(s => s.id === activeSkinId) || SKIN_TONES[0],
    [activeSkinId]);

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

  // Determine styling for an item based on its category
  const getItemStyle = (cat: string) => {
    // ---------------------------------------------------------
    //  MICRO-CALIBRATION SETTINGS (LINKED TO DEV CONTROLS)
    // ---------------------------------------------------------
    const BASE_SCALE = devScale; // Number, not string yet

    // Determine Base Bottom Position
    let baseBottom = devBodyBottom;

    // 1. HEAD ITEMS
    if (["HAIR", "HAT", "GLASSES", "EYES", "MOUTH", "MASK", "BEARD", "BASE_HEAD"].includes(cat)) {
      baseBottom = devHeadBottom;
    }
    // 2. CROPPED BODY ITEMS
    else if (cat === "SHIRT") {
      baseBottom = 10; // Default for cropped items (can be adjusted via offset)
    }
    // 3. GROUND/ENVIRONMENT ITEMS (GRAVESTONE, BACK, FRONT, EMOJI)
    // These default to devBodyBottom (feet level) but can be adjusted via config.
    // DO NOT REMOVE THESE CATEGORIES - They are valid in-game items.

    // Apply Specific Category Config
    const config = categoryConfigs[cat] || { y: 0, x: 0, scale: 100 };
    const finalBottom = baseBottom + config.y;
    const finalLeft = config.x; // Offset from center (0)
    const finalScale = (BASE_SCALE * (config.scale / 100)); // Percentage calculation

    return {
      bottom: `${finalBottom}%`,
      left: `calc(50% + ${finalLeft}%)`,
      width: `${finalScale}%`,
      height: "auto",
      transform: "translateX(-50%)",
      zIndex: Z_INDEX_MAP[cat] || 10,
    };
  };

  // Helper to safely update category config
  const updateCategoryConfig = (key: 'y' | 'x' | 'scale', val: number, mode: 'delta' | 'set' = 'delta') => {
    setCategoryConfigs(prev => {
      const current = prev[selectedCategory] || { y: 0, x: 0, scale: 100 };
      const newValue = mode === 'delta' ? current[key] + val : val;
      return {
        ...prev,
        [selectedCategory]: { ...current, [key]: newValue }
      };
    });
  };

  const [exportData, setExportData] = useState("");
  const [importData, setImportData] = useState("");
  const [showImport, setShowImport] = useState(false);

  const handleExport = () => {
    // Merge existing configs with defaults for all categories
    const allCategoriesConfig: Record<string, { y: number, x: number, scale: number }> = {};

    CALIBRATION_CATEGORIES.forEach(cat => {
      allCategoriesConfig[cat] = categoryConfigs[cat] || { y: 0, x: 0, scale: 100 };
    });

    const config = {
      global: {
        bodyBottom: devBodyBottom,
        headBottom: devHeadBottom,
        scale: devScale,
        containerSize: devContainerSize
      },
      categories: allCategoriesConfig
    };
    setExportData(JSON.stringify(config, null, 2));
  };

  const handleImport = () => {
    try {
      const trimmedData = importData.trim();
      if (!trimmedData) return;

      const config = JSON.parse(trimmedData);
      if (config.global) {
        setDevBodyBottom(config.global.bodyBottom ?? -4);
        setDevHeadBottom(config.global.headBottom ?? 22);
        setDevScale(config.global.scale ?? 64);
        setDevContainerSize(config.global.containerSize ?? 320);
      }
      if (config.categories) {
        setCategoryConfigs(config.categories);
      }
      setShowImport(false);
      setImportData("");
      alert("Configurazione caricata con successo!");
    } catch (e) {
      alert("Errore nel caricamento della configurazione: Assicurati di aver copiato tutto il JSON correttamente.");
    }
  };

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
        <div
          className="relative w-full bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden group transition-all duration-300"
          style={{ aspectRatio: "1 / 1", maxWidth: `${devContainerSize}px` }}
        >
          {/* Grid Background Effect */}
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>

          <div className="relative w-full h-full">

            {/* 1. BASE MANNEQUIN LAYERS (with Filters) */}
            <img
              src={MANNEQUIN_LAYERS.BODY}
              alt="Body Base"
              className="absolute object-contain pointer-events-none"
              style={{
                zIndex: Z_INDEX_MAP.BASE_BODY,
                filter: activeSkin.filter,
                bottom: `${devBodyBottom}%`,
                left: "50%",
                width: `${devScale}%`,
                height: "auto",
                transform: "translateX(-50%)"
              }}
            />
            <img
              src={MANNEQUIN_LAYERS.HEAD}
              alt="Head Base"
              className="absolute object-contain pointer-events-none"
              style={{
                zIndex: Z_INDEX_MAP.BASE_HEAD,
                filter: activeSkin.filter,
                bottom: `${devHeadBottom}%`,
                left: "50%",
                width: `${devScale}%`,
                height: "auto",
                transform: "translateX(-50%)"
              }}
            />

            {/* 2. EQUIPPED ITEMS */}
            {RENDER_ORDER.map((cat) => {
              const item = equippedItems[cat as string];
              if (!item) return null;

              // Skip SKIN category in the item loop as it's handled by the filter system
              if (cat === "SKIN") return null;

              const style = getItemStyle(cat as string);

              return (
                <div
                  key={cat}
                  className="absolute transition-all duration-300 animate-in fade-in zoom-in-95 pointer-events-none"
                  style={{ ...style, position: 'absolute' }}
                >
                  <Image
                    src={WovEngine.resolveImageUrl(item.id, "avatar", item.imageUrl)}
                    alt={cat}
                    width={500}
                    height={500}
                    className="w-full h-full object-contain drop-shadow-md"
                    priority={true}
                    unoptimized
                  />
                </div>
              );
            })}
          </div>
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
                // Don't show SKIN items in this list if they are just colors, 
                // but usually items are real items. For now we hide SKIN category from here 
                // to avoid confusion since we use the selector.
                if (type === "SKIN") return null;

                return (
                  <div
                    key={type}
                    className="relative aspect-square bg-black/40 rounded-lg border border-white/10 p-1 group cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => unequipItem(type)}
                    title={`Rimuovi ${item.name} (${type})`}
                  >
                    <Image
                      src={WovEngine.resolveImageUrl(item.id, "avatar", item.imageUrl)}
                      alt={type}
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />

                    <div className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-lg backdrop-blur-sm">
                      <Trash2 size={14} className="text-white" />
                    </div>
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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold border border-red-500/20"
          >
            <Trash2 size={16} />
            <span>Svuota</span>
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
      {/* ─────────────────────────────────────────────
          DEV CONTROLS (Draggable Panel)
      ───────────────────────────────────────────── */}
      {!showDevPanel && (
        <button
          onClick={() => setShowDevPanel(true)}
          className="fixed bottom-4 right-4 bg-yellow-500 text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform z-[9999]"
          title="Open Dev Calibration"
        >
          <Wrench size={24} />
        </button>
      )}

      {showDevPanel && (
        <div
          className="fixed bg-black/90 backdrop-blur-lg border border-yellow-500/50 rounded-xl shadow-2xl z-[9999] text-xs font-mono w-80 flex flex-col"
          style={{ left: panelPos.x, top: panelPos.y }}
        >
          {/* HEADER (Draggable) */}
          <div
            className="flex items-center justify-between p-2 border-b border-yellow-500/30 cursor-grab active:cursor-grabbing bg-yellow-500/10 rounded-t-xl"
            onMouseDown={startDrag}
          >
            <div className="flex items-center gap-2 text-yellow-400 font-bold select-none">
              <GripHorizontal size={16} />
              <span>CALIBRAZIONE DEV</span>
            </div>
            <button
              onClick={() => setShowDevPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="p-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              {/* BODY CONTROLS */}
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">Body Bottom: <span className="text-white">{devBodyBottom}%</span></span>
                <div className="flex gap-1">
                  <button onClick={() => setDevBodyBottom(p => p - 1)} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-1 rounded border border-red-500/30">-</button>
                  <button onClick={() => setDevBodyBottom(p => p + 1)} className="bg-green-500/20 hover:bg-green-500/40 text-green-300 px-2 py-1 rounded border border-green-500/30">+</button>
                </div>
              </div>

              {/* HEAD CONTROLS */}
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">Head Bottom: <span className="text-white">{devHeadBottom}%</span></span>
                <div className="flex gap-1">
                  <button onClick={() => setDevHeadBottom(p => p - 1)} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-1 rounded border border-red-500/30">-</button>
                  <button onClick={() => setDevHeadBottom(p => p + 1)} className="bg-green-500/20 hover:bg-green-500/40 text-green-300 px-2 py-1 rounded border border-green-500/30">+</button>
                </div>
              </div>

              {/* SCALE CONTROLS */}
              <div className="flex flex-col gap-1 mt-2 border-t border-white/10 pt-2">
                <span className="text-gray-400">Global Scale: <span className="text-white">{devScale}%</span></span>
                <div className="flex gap-1">
                  <button onClick={() => setDevScale(p => p - 1)} className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-2 py-1 rounded border border-blue-500/30">-</button>
                  <button onClick={() => setDevScale(p => p + 1)} className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-2 py-1 rounded border border-blue-500/30">+</button>
                </div>
              </div>

              {/* CONTAINER SIZE CONTROLS */}
              <div className="flex flex-col gap-1 mt-2 border-t border-white/10 pt-2">
                <span className="text-gray-400">Box Size: <span className="text-white">{devContainerSize}px</span></span>
                <div className="flex gap-1">
                  <button onClick={() => setDevContainerSize(p => p - 10)} className="flex-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 px-2 py-1 rounded border border-purple-500/30">-10</button>
                  <button onClick={() => setDevContainerSize(p => p + 10)} className="flex-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 px-2 py-1 rounded border border-purple-500/30">+10</button>
                </div>
              </div>

              {/* CATEGORY CONFIG CONTROLS (X, Y, Scale) */}
              <div className="col-span-2 flex flex-col gap-1 mt-2 border-t border-white/10 pt-2">
                <span className="text-gray-400">Item Calibration</span>

                {/* Category Selector */}
                <div className="flex gap-2 mb-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-black/50 text-white text-xs border border-white/20 rounded px-2 py-1 flex-1"
                  >
                    {CALIBRATION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Vertical Y Control */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span>Vertical (Y)</span>
                    <span className="text-white font-mono">{(categoryConfigs[selectedCategory]?.y || 0).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="0.5"
                    value={categoryConfigs[selectedCategory]?.y || 0}
                    onChange={(e) => updateCategoryConfig('y', parseFloat(e.target.value), 'set')}
                    className="w-full accent-orange-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer mb-1"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => updateCategoryConfig('y', -0.5)} className="flex-1 bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 px-1 py-1 rounded border border-orange-500/30 text-[10px]">-0.5</button>
                    <button onClick={() => updateCategoryConfig('y', 0.5)} className="flex-1 bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 px-1 py-1 rounded border border-orange-500/30 text-[10px]">+0.5</button>
                  </div>
                </div>

                {/* Horizontal X Control */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span>Horizontal (X)</span>
                    <span className="text-white font-mono">{(categoryConfigs[selectedCategory]?.x || 0).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="0.5"
                    value={categoryConfigs[selectedCategory]?.x || 0}
                    onChange={(e) => updateCategoryConfig('x', parseFloat(e.target.value), 'set')}
                    className="w-full accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer mb-1"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => updateCategoryConfig('x', -0.5)} className="flex-1 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 px-1 py-1 rounded border border-pink-500/30 text-[10px]">-0.5</button>
                    <button onClick={() => updateCategoryConfig('x', 0.5)} className="flex-1 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 px-1 py-1 rounded border border-pink-500/30 text-[10px]">+0.5</button>
                  </div>
                </div>

                {/* Scale Control */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span>Scale %</span>
                    <span className="text-white font-mono">{(categoryConfigs[selectedCategory]?.scale || 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="1"
                    value={categoryConfigs[selectedCategory]?.scale || 100}
                    onChange={(e) => updateCategoryConfig('scale', parseFloat(e.target.value), 'set')}
                    className="w-full accent-cyan-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer mb-1"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => updateCategoryConfig('scale', -1)} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 px-1 py-1 rounded border border-cyan-500/30 text-[10px]">-1%</button>
                    <button onClick={() => updateCategoryConfig('scale', 1)} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 px-1 py-1 rounded border border-cyan-500/30 text-[10px]">+1%</button>
                  </div>
                </div>

                {/* IMPORT/EXPORT BUTTONS */}
                <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                  {!showImport ? (
                    <>
                      <button
                        onClick={handleExport}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 px-2 py-1 rounded border border-green-500/30 text-[10px] font-bold"
                      >
                        EXPORT
                      </button>
                      <button
                        onClick={() => setShowImport(true)}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-2 py-1 rounded border border-blue-500/30 text-[10px] font-bold"
                      >
                        IMPORT
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2">
                      <textarea
                        className="w-full h-24 bg-black/50 text-[10px] text-blue-400 p-1 rounded border border-blue-500/30 font-mono"
                        placeholder="Paste JSON config here..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={handleImport}
                          className="flex-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 px-2 py-1 rounded border border-green-500/30 text-[10px]"
                        >
                          APPLY
                        </button>
                        <button
                          onClick={() => setShowImport(false)}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-1 rounded border border-red-500/30 text-[10px]"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* EXPORT DISPLAY (Only if active) */}
                {exportData && !showImport && (
                  <div className="mt-2 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2">
                    <textarea
                      className="w-full h-24 bg-black/50 text-[10px] text-green-400 p-1 rounded border border-green-500/30 font-mono"
                      readOnly
                      value={exportData}
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <button
                      onClick={() => setExportData("")}
                      className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-1 rounded border border-red-500/30 text-[10px]"
                    >
                      CLOSE
                    </button>
                  </div>
                )}

                {/* RESET CALIBRATION */}
                <button
                  onClick={() => {
                    if (confirm("Reset all calibration settings to defaults?")) {
                      setDevBodyBottom(-4);
                      setDevHeadBottom(20);
                      setDevScale(40);
                      setDevContainerSize(500);
                      // Reset category configs? Maybe not all of them, just the global ones for now
                      // or we could reset everything if we had the initial state handy.
                    }
                  }}
                  className="mt-4 w-full bg-red-500/10 text-red-400 py-2 rounded border border-red-500/20 hover:bg-red-500/30 text-[10px] uppercase font-bold tracking-wider transition-all"
                >
                  Reset Global Calibration
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
