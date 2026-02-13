import { WovAvatarItem } from "./wolvesville-types";

// Manual mapping for items where API metadata might be incomplete or specific overrides are needed
// This acts as a fallback database for categories and specific CDN URLs

export interface ItemMapping {
  category?: string;
  name?: string;
  cdnUrl?: string;
}

// Map short IDs or specific IDs to their metadata
export const DEFAULT_SKINS: WovAvatarItem[] = [
  { id: "skin_pale", type: "SKIN", rarity: "COMMON", name: "Pale", imageUrl: "color:#F5D0B0" },
  { id: "skin_tan", type: "SKIN", rarity: "COMMON", name: "Tan", imageUrl: "color:#E0AC69" },
  { id: "skin_brown", type: "SKIN", rarity: "COMMON", name: "Brown", imageUrl: "color:#8D5524" },
  { id: "skin_dark_brown", type: "SKIN", rarity: "COMMON", name: "Dark Brown", imageUrl: "color:#523218" },
  { id: "skin_black", type: "SKIN", rarity: "COMMON", name: "Black", imageUrl: "color:#2B2B2B" },
  { id: "skin_grey", type: "SKIN", rarity: "COMMON", name: "Grey", imageUrl: "color:#7A7A7A" },
  { id: "skin_werewolf", type: "SKIN", rarity: "COMMON", name: "Werewolf", imageUrl: "color:#607D8B" },
  { id: "skin_white", type: "SKIN", rarity: "COMMON", name: "White", imageUrl: "color:#FFFFFF" },
];

export const ITEM_MAPPINGS: Record<string, ItemMapping> = {
  "1wL": { category: "HAT", name: "Top Hat" },
  // Add more manual mappings here as needed
};

// Helper to get category from ID if manually mapped
export function getCategoryFromId(id: string): string | null {
  if (ITEM_MAPPINGS[id]) return ITEM_MAPPINGS[id].category || null;
  return null;
}

/**
 * Enriches a raw item with manual mapping data
 * Ensures every item has a valid category and name
 */
export function enrichItem(item: WovAvatarItem): WovAvatarItem {
  try {
    const mapping = ITEM_MAPPINGS[item.id];

    // Default values if missing
    let category = item.type || "SHIRT";

    // Normalize Category Names (API inconsistencies)
    const rawCategory = category as string;
    if (rawCategory === "BODY" || rawCategory === "SKIN_COLOR" || rawCategory === "COLOR" || rawCategory === "BASE_BODY" || rawCategory === "APPEARANCE") {
      category = "SKIN";
    } else if (rawCategory === "HAIRSTYLE" || rawCategory === "HAIR_COLOR") {
      category = "HAIR";
    } else if (rawCategory === "HEAD_WEAR") {
      category = "HAT";
    } else if (rawCategory === "EYE_WEAR") {
      category = "GLASSES";
    } else if (rawCategory === "NECK_WEAR") {
      category = "SHIRT"; // Fallback as NECK is removed
    } else if (rawCategory === "HAND_ITEM") {
      category = "SHIRT"; // Fallback as HAND is removed
    } else if (rawCategory === "PANTS" || rawCategory === "SHOES" || rawCategory === "CLOTHES") {
      category = "SHIRT"; // Fallback for removed categories
    }

    let name = item.name || `Item ${item.id}`;

    // Apply mapping overrides
    if (mapping) {
      if (mapping.category) category = mapping.category as any;
      if (mapping.name) name = mapping.name;
    }

    // If category is still unknown or generic, try to infer or keep it permissive
    if (!category || (category as string) === "UNKNOWN") {
      category = "SHIRT";
    }

    return {
      ...item,
      type: category,
      name: name,
      // We don't override imageUrl here, as that is dynamic based on the category we just resolved
    };
  } catch (error) {
    console.error("Error mapping item:", item.id, error);
    return item;
  }
}
