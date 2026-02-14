import { WovCategory, WovDensity } from "./wolvesville-types";

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  originalWidth: number;
  originalHeight: number;
}

// Coordinate di ancoraggio sul Manichino (relative al centro 0,0 del canvas virtuale)
// Basate sui valori di default forniti e stime visive
const AVATAR_ANCHORS: Partial<Record<WovCategory, { x: number; y: number; align: "center" | "bottom_to_top" | "center_to_center" }>> = {
  // HAT: Bottom to Top (Fronte). 
  // Se la testa è a y: -612 (virtual), la fronte sarà circa a -800? 
  // Proviamo un valore empirico basato su "Head Top".
  HAT: { x: 0, y: -400, align: "bottom_to_top" },

  HAIR: { x: 0, y: -300, align: "center_to_center" },
  GLASSES: { x: 0, y: -150, align: "center_to_center" }, // Occhi
  EYES: { x: 0, y: -150, align: "center_to_center" },

  MOUTH: { x: 0, y: 50, align: "center_to_center" }, // Bocca
  MASK: { x: 0, y: 50, align: "center_to_center" },
  BEARD: { x: 0, y: 50, align: "center_to_center" },

  SHIRT: { x: 0, y: 200, align: "center_to_center" },
  BODY: { x: 0, y: 0, align: "center_to_center" },
};

/**
 * Carica un'immagine e analizza i suoi pixel per trovare il Bounding Box visibile.
 */
export async function analyzeImageBoundingBox(imageUrl: string): Promise<BoundingBox | null> {
  return new Promise((resolve, reject) => {
    // Check if running in browser
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    // Direct load - will fail if CDN doesn't support CORS, but required for static export (no API proxy)
    img.src = imageUrl;

    img.onerror = () => {
      console.warn("Auto-calibration: Failed to load image (CORS or network error)", imageUrl);
      resolve(null);
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject("Canvas context not available");
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let minX = canvas.width, maxX = 0;
      let minY = canvas.height, maxY = 0;
      let found = false;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 10) { // Threshold per trasparenza
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            found = true;
          }
        }
      }

      if (!found) {
        resolve(null); // Immagine completamente trasparente
        return;
      }

      resolve({
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: minX + (maxX - minX) / 2,
        centerY: minY + (maxY - minY) / 2,
        originalWidth: canvas.width,
        originalHeight: canvas.height
      });
    };

    img.onerror = (err) => {
      console.error("Errore caricamento immagine per analisi:", imageUrl, err);
      resolve(null);
    };
  });
}

/**
 * Calcola l'offset di calibrazione ideale basato sulla categoria e il bounding box.
 * 
 * @param category Categoria dell'item
 * @param bbox Bounding box rilevato
 * @param originalSize Dimensione originale dell'immagine (per normalizzazione se necessario)
 */
export function calculateAutoOffset(
  category: WovCategory,
  bbox: BoundingBox,
  originalWidth: number,
  originalHeight: number
): { x: number, y: number } {
  const anchor = AVATAR_ANCHORS[category];

  // Se non abbiamo un anchor specifico, centriamo tutto su 0,0
  if (!anchor) {
    return { x: 0, y: 0 };
  }

  let offsetX = 0;
  let offsetY = 0;

  // Calcolo X: Centrare l'oggetto rispetto all'anchor X
  // Il centro dell'oggetto rilevato (bbox.centerX) deve andare su anchor.x
  // Ma attenzione: il sistema di coordinate attuale usa translate(-50%, -50%) che centra l'INTERA immagine originale.
  // Quindi (0,0) è il centro dell'immagine originale (originalWidth/2, originalHeight/2).

  const imgCenterX = originalWidth / 2;
  const imgCenterY = originalHeight / 2;

  // Distanza tra il centro "visivo" dell'oggetto e il centro "fisico" dell'immagine
  const visualShiftX = bbox.centerX - imgCenterX;
  const visualShiftY = bbox.centerY - imgCenterY;

  // Logica di allineamento
  if (anchor.align === "center_to_center") {
    // Vogliamo che il centro visivo (bbox.centerX) coincida con anchor.x
    // Attualmente è a (0,0) + visualShiftX
    // Offset necessario = anchor.x - visualShiftX
    offsetX = anchor.x - visualShiftX;
    offsetY = anchor.y - visualShiftY;
  }
  else if (anchor.align === "bottom_to_top") {
    // Il fondo dell'oggetto (bbox.maxY) deve coincidere con anchor.y
    // bbox.maxY è relativo all'angolo in alto a sinistra (0,0 dell'immagine)
    // Convertiamo in coordinate relative al centro:
    const visualBottomY = bbox.maxY - imgCenterY;

    offsetX = anchor.x - visualShiftX; // Centriamo X comunque? Di solito sì.
    offsetY = anchor.y - visualBottomY;
  }

  // Normalizzazione in "Virtual Units" (1000 = 100% dell'immagine)
  // AvatarCanvas usa: translate( (calibration.x / 1000) * 100 % )
  // Quindi calibration.x deve essere (offsetX / originalWidth) * 1000

  const virtualX = (offsetX / originalWidth) * 1000;
  const virtualY = (offsetY / originalHeight) * 1000;

  return { x: virtualX, y: virtualY };
}
