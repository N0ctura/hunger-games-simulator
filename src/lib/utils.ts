import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { WovDensity } from "./wolvesville-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDensity(url: string | undefined): WovDensity {
  if (!url) return "@1";
  if (url.includes("@3")) return "@3";
  if (url.includes("@2")) return "@2";
  if (url.includes("@1")) return "@1";
  // Default to @1 if no density tag is found (e.g. .store.png images)
  // These images are usually small previews, but we treat them as 1x.
  return "@1";
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback implementation for environments where crypto.randomUUID is not available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
