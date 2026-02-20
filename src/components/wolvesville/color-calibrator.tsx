"use client";

import { useState, useMemo } from "react";
import { WovAvatarItem } from "@/lib/wolvesville-types";
import colorCalibrationData from "@/data/color-calibration.json";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wrench, Download, Check, ChevronLeft, ChevronRight, Search, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ColorCalibratorProps {
  allItems: WovAvatarItem[];
}

const COLORS = [
  "black", "blue", "brown", "gray", "green", "multicolor",
  "orange", "pink", "purple", "red", "white", "yellow"
];

export function ColorCalibrator({ allItems }: ColorCalibratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeColor, setActiveColor] = useState<string>(COLORS[0]);
  const [hiddenColors, setHiddenColors] = useState<string[]>([]);
  const [calibratedData, setCalibratedData] = useState<Record<string, string[]>>(colorCalibrationData as Record<string, string[]>);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 50;
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    let result = allItems;

    // Filter hidden colors
    if (hiddenColors.length > 0) {
      result = result.filter(item => {
        const itemColors = calibratedData[item.id] || [];
        // If item has ANY of the hidden colors, exclude it
        return !itemColors.some(c => hiddenColors.includes(c));
      });
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(i => i.id.toLowerCase().includes(lower) || (i.name && i.name.toLowerCase().includes(lower)));
    }
    return result;
  }, [allItems, searchTerm, hiddenColors, calibratedData]);

  const pageItems = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const toggleItemColor = (itemId: string) => {
    setCalibratedData(prev => {
      const currentColors = prev[itemId] || [];
      const hasColor = currentColors.includes(activeColor);

      let newColors;
      if (hasColor) {
        newColors = currentColors.filter(c => c !== activeColor);
      } else {
        newColors = [...currentColors, activeColor];
      }

      // Cleanup empty entries
      if (newColors.length === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }

      return { ...prev, [itemId]: newColors };
    });
  };

  const toggleHiddenColor = (color: string) => {
    setHiddenColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
    setPage(0);
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(calibratedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "color_calibration.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-dashed">
          <Wrench size={14} />
          Calibrazione Colori
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex justify-between items-center">
            <span>Calibrazione Colori ({Object.keys(calibratedData).length} items calibrati)</span>
            <div className="flex gap-2">
              <Button onClick={downloadJson} size="sm" variant="default" className="gap-2">
                <Download size={14} />
                Scarica JSON
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden bg-slate-950 text-slate-100">
          {/* Sidebar: Color Selection */}
          <div className="w-56 border-r border-slate-800 p-4 bg-slate-900/50 space-y-2 overflow-y-auto flex flex-col">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Seleziona Colore</h3>

            {COLORS.map(color => {
              const isHidden = hiddenColors.includes(color);
              const isSelected = activeColor === color;

              return (
                <div key={color} className="flex gap-1 items-center">
                  <button
                    onClick={() => setActiveColor(color)}
                    className={`flex-1 text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${isSelected
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-slate-800 bg-slate-900/40 text-slate-300"
                      }`}
                  >
                    <span className="capitalize">{color}</span>
                    {/* Dot indicator */}
                    <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: color === 'multicolor' ? 'transparent' : color, background: color === 'multicolor' ? 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' : undefined }} />
                  </button>

                  {/* Hide/Show Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 shrink-0 ${isHidden ? "text-red-400 bg-red-500/10 hover:bg-red-500/20" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHiddenColor(color);
                    }}
                    title={isHidden ? "Mostra item" : "Nascondi item"}
                  >
                    {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                </div>
              )
            })}

            {/* Legend/Help */}
            <div className="mt-auto pt-4 text-[10px] text-slate-500 border-t border-slate-800">
              <p className="flex items-center gap-2 mb-1">
                <Eye size={12} /> Visibile
              </p>
              <p className="flex items-center gap-2">
                <EyeOff size={12} className="text-red-400" /> Nascosto
              </p>
            </div>
          </div>

          {/* Main Area: Item Grid */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden bg-slate-950">
            {/* Search & Pagination Controls */}
            <div className="flex gap-4 mb-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Cerca item..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                  className="pl-8 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-400">
                  Pagina {page + 1} di {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border-slate-800 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="border-slate-800 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-2 content-start pr-2">
              {pageItems.map(item => {
                const itemColors = calibratedData[item.id] || [];
                const isSelected = itemColors.includes(activeColor);

                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItemColor(item.id)}
                    className={`relative aspect-square rounded-md border-2 overflow-hidden group transition-all ${isSelected
                      ? "border-primary bg-primary/20"
                      : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800"
                      }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.id}
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                        <Check size={10} strokeWidth={4} />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-white p-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity text-center">
                      {item.id}
                    </div>
                    {/* Show small dots for other assigned colors */}
                    <div className="absolute bottom-1 left-1 flex gap-0.5 flex-wrap max-w-full">
                      {itemColors.filter(c => c !== activeColor).map(c => (
                        <div
                          key={c}
                          className="w-1.5 h-1.5 rounded-full border border-white/30"
                          style={{
                            backgroundColor: c === 'multicolor' ? 'transparent' : c,
                            background: c === 'multicolor' ? 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' : undefined
                          }}
                          title={c}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
