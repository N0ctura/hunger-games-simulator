"use client";

import { useWardrobe } from "@/context/wolvesville-context";
import { WovAvatarItem, WovCategory } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import { Loader2, RefreshCw, Trash2, Download } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const LAYER_ORDER: WovCategory[] = [
  "BACK",
  "GRAVESTONE", // Usually hidden behind
  "CLOTHES", // Base body?
  "SHIRT",
  "PANTS",
  "SHOES",
  "NECK",
  "MOUTH",
  "EYES",
  "HAIR",
  "GLASSES",
  "MASK",
  "HAT",
  "HAND",
  "FRONT"
];

export function Wardrobe() {
  const { equippedItems, unequipItem, clearWardrobe } = useWardrobe();
  const [generating, setGenerating] = useState(false);

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

  return (
    <div className="sticky top-24 bg-card/30 backdrop-blur-md border border-border rounded-xl p-4 flex flex-col items-center gap-4 w-full">
      <h3 className="text-xl font-bold font-serif gold-text">Guardaroba</h3>
      
      {/* Mannequin Preview Area */}
      <div className="relative w-64 h-64 bg-black/20 rounded-lg border border-white/5 overflow-hidden flex items-center justify-center">
        {isEmpty ? (
          <p className="text-muted-foreground text-xs text-center px-4">
            Seleziona oggetti dalla griglia per vestire il tuo avatar
          </p>
        ) : (
          <div className="relative w-full h-full">
            {LAYER_ORDER.map((cat) => {
              const item = equippedItems[cat as string];
              if (!item) return null;
              
              return (
                <div key={cat} className="absolute inset-0 z-[var(--z)]" style={{ "--z": LAYER_ORDER.indexOf(cat) } as any}>
                  <Image 
                    src={WovEngine.resolveImageUrl(item.id, "avatar", item.imageUrl)} 
                    alt={cat}
                    fill
                    className="object-contain"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Equipped List (Mini) */}
      <div className="w-full grid grid-cols-4 gap-2">
        {Object.entries(equippedItems).map(([type, item]) => (
          <div 
            key={type} 
            className="relative aspect-square bg-black/40 rounded border border-white/10 p-1 group cursor-pointer"
            onClick={() => unequipItem(type)}
            title={`Rimuovi ${item.name}`}
          >
            <Image 
              src={WovEngine.resolveImageUrl(item.id, "avatar", item.imageUrl)} 
              alt={type}
              fill
              className="object-contain"
            />
            <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
              <Trash2 size={12} className="text-red-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full mt-2">
        <button 
          onClick={clearWardrobe}
          disabled={isEmpty}
          className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-bold"
        >
          <Trash2 size={14} />
          <span>Svuota</span>
        </button>
        
        <button 
          onClick={handleGenerateUrl}
          disabled={isEmpty || generating}
          className="flex-[2] flex items-center justify-center gap-2 p-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-bold"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          <span>Genera Link</span>
        </button>
      </div>
    </div>
  );
}
