import { WovAvatarItem } from "./wolvesville-types";

// Manual mapping for items where API metadata might be incomplete or specific overrides are needed
// This acts as a fallback database for categories and specific CDN URLs

export interface ItemMapping {
  category?: string;
  name?: string;
  cdnUrl?: string;
}

// Map short IDs or specific IDs to their metadata
export const ITEM_MAPPINGS: Record<string, ItemMapping> = {
  // Example entries - we will expand this as we discover more specific needs
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
    let category = item.type || "CLOTHES";
    let name = item.name || `Item ${item.id}`;

    // Apply mapping overrides
    if (mapping) {
      if (mapping.category) category = mapping.category as any;
      if (mapping.name) name = mapping.name;
    }

    // If category is still unknown or generic, try to infer or keep it permissive
    if (!category || category === "UNKNOWN") {
      category = "CLOTHES";
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
