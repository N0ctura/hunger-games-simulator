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
