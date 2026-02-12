export type WovRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type WovCategory =
  | "HAIR"
  | "HAT"
  | "EYES"
  | "MOUTH"
  | "CLOTHES"
  | "BACK"
  | "HAND"
  | "MASK"
  | "NECK"
  | "GLASSES"
  | "SHIRT"
  | "PANTS"
  | "SHOES"
  | "FRONT"
  | "BEARD"
  | "GRAVESTONE"
  | "EMOJI";

export interface WovRole {
  id: string;
  name: string;
  description?: string;
  team?: string;
  aura?: string;
  image: {
    url: string;
    width: number;
    height: number;
  };
}

export interface WovAvatarItem {
  id: string;
  rarity: WovRarity;
  costInGold?: number;
  costInGems?: number;
  type: WovCategory;
  imageUrl: string;
  name?: string; // Sometimes inferred from ID or Set
}

export interface WovAvatarSet {
  id: string;
  name: string; // Internal name or set ID
  promoImageUrl?: string;
  items?: WovAvatarItem[];
  avatarItemIds?: string[];
}

export interface WovBackground {
  id: string;
  name?: string;
  rarity: WovRarity;
  imageUrl: string;
  imageDayUrl?: string; // For day/night variants if applicable
  imageNightUrl?: string;
}

export interface WovLoadingScreen {
  id: string;
  url: string;
  imageDayUrl?: string;
  imageNightUrl?: string;
  rarity: WovRarity;
}

export interface WovClan {
  id: string;
  name: string;
  description?: string;
  language?: string;
  creationTime?: string;
  memberCount: number;
  icon?: string;
  iconColor?: string;
}

export interface WovClanQuest {
  id: string;
  name: string;
  description: string;
  promoImageUrl?: string;
  rewards: {
    type: "GOLD" | "GEMS" | "ITEM" | "XP";
    amount?: number;
    itemId?: string;
  }[];
}

export type WovItemType = "ROLE" | "AVATAR_SET" | "BACKGROUND" | "ITEM" | "LOADING_SCREEN" | "CLAN";
