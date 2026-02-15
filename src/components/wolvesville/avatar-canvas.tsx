"use client";

import React from "react";
import { useWolvesville } from "@/context/wolvesville-context";
import { WovCategory } from "@/lib/wolvesville-types";

// ─────────────────────────────────────────────
//  CONSTANTS & CONFIGURATION
// ─────────────────────────────────────────────

const CANVAS_WIDTH = 209;
const CANVAS_HEIGHT = 314;

export const SKIN_TONES = [
  {
    id: "skin-1",
    color: "#F5D0B0",
    bodySrc: "https://cdn2.wolvesville.com/bodyPaints/body-skin-1.avatar-large@3x.png",
    headSrc: "https://cdn2.wolvesville.com/bodyPaints/head-skin-1.avatar-large@3x.png"
  },
  {
    id: "skin-2",
    color: "#E0AC69",
    bodySrc: "https://cdn2.wolvesville.com/bodyPaints/body-skin-2.avatar-large@3x.png",
    headSrc: "https://cdn2.wolvesville.com/bodyPaints/head-skin-2.avatar-large@3x.png"
  },
  {
    id: "skin-3",
    color: "#C68642",
    bodySrc: "https://cdn2.wolvesville.com/bodyPaints/body-skin-3.avatar-large@3x.png",
    headSrc: "https://cdn2.wolvesville.com/bodyPaints/head-skin-3.avatar-large@3x.png"
  },
  {
    id: "skin-4",
    color: "#8D5524",
    bodySrc: "https://cdn2.wolvesville.com/bodyPaints/body-skin-4.avatar-large@3x.png",
    headSrc: "https://cdn2.wolvesville.com/bodyPaints/head-skin-4.avatar-large@3x.png"
  },
  {
    id: "skin-5",
    color: "#5D3A1A",
    bodySrc: "https://cdn2.wolvesville.com/bodyPaints/body-skin-5.avatar-large@3x.png",
    headSrc: "https://cdn2.wolvesville.com/bodyPaints/head-skin-5.avatar-large@3x.png"
  },
  {
    id: "skin-6",
    color: "#2B1B12",
    bodySrc: "https://cdn2.wolvesville.com/bodyPaints/body-skin-6.avatar-large@3x.png",
    headSrc: "https://cdn2.wolvesville.com/bodyPaints/head-skin-6.avatar-large@3x.png"
  }
];

// 1. DOM Structure & Layering (Requested)
interface LayerConfig {
  id: string;
  zIndex: number;
  offsetKey: string;
  category?: WovCategory; // Map to internal category
  isMannequin?: "BODY" | "HEAD";
}

const LAYER_HIERARCHY: LayerConfig[] = [
  { id: 'div-back-item', zIndex: 5, offsetKey: 'back', category: "BACK" },
  { id: 'div-gravestone', zIndex: 6, offsetKey: 'gravestone', category: "GRAVESTONE" },
  { id: 'div-body-skin', zIndex: 10, offsetKey: 'body-skin', isMannequin: "BODY" },
  { id: 'div-shirt', zIndex: 20, offsetKey: 'shirt', category: "SHIRT" },
  { id: 'div-head-skin', zIndex: 30, offsetKey: 'head-skin', isMannequin: "HEAD" },
  { id: 'div-beard', zIndex: 35, offsetKey: 'beard', category: "BEARD" },
  { id: 'div-mouth', zIndex: 40, offsetKey: 'mouth', category: "MOUTH" },
  { id: 'div-eyes', zIndex: 50, offsetKey: 'eyes', category: "EYES" },
  { id: 'div-mask', zIndex: 70, offsetKey: 'mask', category: "MASK" },
  { id: 'div-glasses', zIndex: 80, offsetKey: 'glasses', category: "GLASSES" },
  { id: 'div-hair', zIndex: 85, offsetKey: 'hair', category: "HAIR" },
  { id: 'div-hat', zIndex: 90, offsetKey: 'hat', category: "HAT" },
  { id: 'div-front-item', zIndex: 100, offsetKey: 'front', category: "FRONT" },
  { id: 'div-emoji', zIndex: 110, offsetKey: 'emoji', category: "EMOJI" },
];

// Helper to get style - NOW SIMPLIFIED to strict "Wolvesville DOM" logic
// Per user instruction: "non prendere come riferimento i file @2 o @3 ma esclusivamente la configurazione div"
// div.tx shows all items at Bottom: 0, Left: 0. This implies assets are pre-positioned (Full Canvas).
function getItemStyle(itemId: string | undefined, src: string | undefined): React.CSSProperties {
  if (!src) return {};

  // Determine scale based on density suffix
  let scale = 1;
  if (src.includes("@3x")) {
    scale = 1 / 3; // 0.3333...
  } else if (src.includes("@2x")) {
    scale = 1 / 2; // 0.5
  }

  return {
    display: 'block',
    position: 'absolute',
    bottom: 0,
    left: '50%', // Center horizontally
    width: 'auto', // Use natural size
    height: 'auto',
    maxWidth: 'none', // Allow exceeding container if needed (e.g. big wings)
    maxHeight: 'none',
    transform: `translateX(-50%) scale(${scale})`, // Center and scale down
    transformOrigin: 'bottom center', // Scale from bottom center
    pointerEvents: 'none'
  };
}

// Helper to convert Store URL to Avatar URL
function getAvatarItemUrl(url: string): string {
  if (!url) return "";
  if (!url.includes("wolvesville.com")) return url;

  // Convert .store to .avatar-large
  // Example: .../clothes-1.store.png -> .../clothes-1.avatar-large@2x.png
  // Example: .../clothes-1.store@2x.png -> .../clothes-1.avatar-large@2x.png

  let newUrl = url;

  if (newUrl.includes(".store")) {
    newUrl = newUrl.replace(".store", ".avatar-large");
  }

  // Ensure @2x resolution for consistency with offsets.json (density: 2)
  // If it doesn't have @2x or @3x, add @2x
  if (!newUrl.includes("@")) {
    newUrl = newUrl.replace(".png", "@2x.png");
  } else if (newUrl.includes("@3x")) {
    // Optional: Force @2x if we think offsets are for @2x? 
    // But body/head are @3x. Let's leave @3x if it's there, but default to @2x if replacing store.
    // Actually, store icons usually don't have @ suffix in the basic URL, or might have @2x.
    // If we replaced .store with .avatar-large, we might need to add @2x.
  }

  // Fix: Ensure .avatar-large is followed by @2x if not present
  if (newUrl.includes(".avatar-large") && !newUrl.includes("@")) {
    newUrl = newUrl.replace(".png", "@2x.png");
  }

  // FORCE @2x for non-body parts to ensure alignment if they were @3x?
  // User says: "some shirts/hair align, others don't".
  // div.tx shows head/body @3x, but items @2x.
  // Let's try to respect what the URL is, but maybe force @2x for standard items if they are not body/head?

  return newUrl;
}


// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────

interface AvatarCanvasProps {
  className?: string;
  skinId?: string;
  showMannequin?: boolean;
  exportMode?: boolean;
  exportLayout?: 'raw' | 'scene';
  backgroundColor?: string;
  showGradient?: boolean;
}

export function AvatarCanvas({ className, skinId = SKIN_TONES[0].id, showMannequin = true, exportMode = false, exportLayout = 'raw', backgroundColor, showGradient = true }: AvatarCanvasProps) {
  const { equippedItems } = useWolvesville();

  const activeSkin = SKIN_TONES.find(s => s.id === skinId) || SKIN_TONES[0];

  // Determine container styles based on layout
  const isScene = !exportMode || exportLayout === 'scene';

  const containerClass = exportMode && exportLayout === 'raw'
    ? `relative overflow-hidden flex items-center justify-center ${className}` // Center the inner canvas
    : `relative w-full h-full bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl border-4 border-[#2a2a2a] flex items-end justify-center pb-3.5 ${className}`;

  // For export 'raw', we use larger dimensions to capture full avatar including parts that extend beyond standard size
  // For 'scene' or interactive, we let parent/classes control size.
  const containerStyle: React.CSSProperties = exportMode && exportLayout === 'raw'
    ? { width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT * 1.5}px` }
    : {};
  if (backgroundColor) {
    containerStyle.backgroundColor = backgroundColor;
  }

  return (
    // Outer Wrapper
    <div
      className={containerClass}
      style={containerStyle}
    >
      {isScene && showGradient !== false && !backgroundColor && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#1e293b] opacity-50" />
      )}

      {/* Inner Anchor - "The Mannequin Grid" (209x314) */}
      <div
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          position: 'relative',
          flexShrink: 0,
          // Scale: 0.45 for Scene (interactive or export), None for Raw Export
          transform: isScene ? 'scale(0.45)' : 'none',
          transformOrigin: 'bottom center',
        }}
      >
        {/* Global Transform Wrapper */}
        <div
          className="w-full h-full absolute top-0 left-0"
          style={{
            transform: isScene ? 'translateY(25px)' : 'none'
          }}
        >
          {LAYER_HIERARCHY.map((layer) => {
            let src: string | null = null;
            let itemId: string | undefined = undefined;

            // Logic to determine content and ID
            if (layer.isMannequin) {
              if (layer.isMannequin === "BODY") {
                if (equippedItems["SKIN"]) {
                  src = getAvatarItemUrl(equippedItems["SKIN"].imageUrl);
                  itemId = equippedItems["SKIN"].id;
                } else if (showMannequin) {
                  src = (activeSkin as any).bodySrc || null;
                }
              } else if (layer.isMannequin === "HEAD") {
                if (showMannequin) {
                  src = (activeSkin as any).headSrc || null;
                }
              }
            } else if (layer.category) {
              const item = equippedItems[layer.category];
              if (item) {
                src = getAvatarItemUrl(item.imageUrl);
                itemId = item.id;
              }
            }
            // Get style from "Cheat" offsets.json
            const style = getItemStyle(itemId, src || undefined);

            // Proxy logic REMOVED - direct loading for visualization
            // No more /api/proxy-image or CORS proxies that break loading
            // if (exportMode && src && src.startsWith('http')) {
            //   src = `/api/proxy-image?url=${encodeURIComponent(src)}`;
            // }

            // Render Image
            const renderImage = () => {
              if (!src) return null;

              return (
                <img
                  src={src}
                  alt={layer.category || layer.id}
                  width="auto"
                  height="auto"
                  style={{
                    ...style,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    objectFit: 'none' // Prevent object-fit stretching
                  }}
                // crossOrigin="anonymous" removed because Wolvesville CDN blocks it
                />
              );
            };

            return (
              <div
                key={layer.id}
                id={layer.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: layer.zIndex,
                  pointerEvents: 'none'
                }}
              >
                {renderImage()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
