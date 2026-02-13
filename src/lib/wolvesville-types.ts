export type WovRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHICAL" | "MYTHIC";

export type WovCategory =
  | "HAIR"
  | "HAT"
  | "EYES"
  | "MOUTH"
  | "BACK"
  | "MASK"
  | "GLASSES"
  | "SHIRT"
  | "FRONT"
  | "BEARD"
  | "GRAVESTONE" // Special reward category - DO NOT REMOVE
  | "EMOJI"      // Collectable item - DO NOT REMOVE
  | "SKIN"
  | "SET";       // Full outfit sets

export interface WovRole {
  id: string;
  name: string;
  description?: string;
  team?: string;
  aura?: string;
  isAdvanced?: boolean;
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
  avatarItemSets?: string[]; // IDs of sets included in this bundle
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
  memberCount: number;
  icon?: string;
  iconColor?: string;
  xp?: number;
  creationTime?: string;
  questHistoryCount?: number;
  joinType?: "PRIVATE" | "JOIN_BY_REQUEST" | "PUBLIC";
  minLevel?: number;
}

export interface ClanSearchOptions {
  name?: string;
  minLevel?: number;
  maxLevel?: number; // Not supported by API but useful for client-side filtering if needed
  language?: string;
  joinType?: "PRIVATE" | "JOIN_BY_REQUEST" | "PUBLIC";
  notFull?: boolean;
  sortBy?: "XP" | "CREATION_TIME" | "QUEST_HISTORY_COUNT" | "NAME" | "MIN_LEVEL";
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

export interface WovShopOffer {
  id: string;
  promoImageUrl?: string;
  costInGems?: number;
  costInGold?: number;
  avatarItemSets?: WovAvatarSet[]; // Nested sets in the offer
  items?: WovAvatarItem[];
  rewards?: {
    type: string;
    amount?: number;
    avatarItemId?: string;
    avatarItemSetId?: string;
  }[];
}

export interface WovCalendar {
  id: string;
  iconUrl?: string;
  days: {
    day: number;
    reward: {
      type: string;
      amount?: number;
      avatarItemId?: string;
      avatarItemSetId?: string;
    };
  }[];
}

export interface WovRoleIcon {
  id: string;
  rarity: WovRarity;
  image: {
    url: string;
    width: number;
    height: number;
  };
  roleId?: string; // If linked to a specific role
}

export interface WovRankedSeason {
  id: string;
  number: number;
  startTime: string;
  endTime: string;
  rewards: {
    minSkill: number;
    rewards: {
      type: string;
      amount?: number;
      avatarItemId?: string;
    }[];
  }[];
}

export interface WovPlayerLeaderboardEntry {
  playerId: string;
  username: string;
  skill?: number;
  xp?: number;
  rank?: number; // Added by us if not in API
}

export interface WovRoleCard {
  roleIdBase: string;
  roleIdsAdvanced: string[];
  rarity: WovRarity;
  abilityId1?: string;
  abilityId2?: string;
  abilityId3?: string;
  abilityId4?: string;
  abilityId5?: string;
  roleId1?: string; // Legacy/Alt format
  roleId2?: string; // Legacy/Alt format
}

export interface WovRoleAchievement {
  roleId: string;
  level: number;
  points: number;
  pointsNextLevel: number;
  category: string;
}

export interface WovPlayerProfile {
  id: string;
  username: string;
  level: number;
  lastOnline: string;
  creationTime?: string;
  personalMessage?: string; // Bio
  status?: string; // ONLINE | OFFLINE | PLAYING
  profileIcon?: {
    id: string;
    url: string;
  };
  equippedAvatar?: {
    url: string;
    width: number;
    height: number;
  };
  rankedSeasonSkill?: number;
  rankedSeasonMaxSkill?: number;
  rankedSeasonBestRank?: number;
  badgeIds?: string[];
  roleCards?: WovRoleCard[];
  gameStats?: {
    totalWinCount: number;
    totalLoseCount: number;
    totalPlayTimeInMinutes: number;
    achievements?: WovRoleAchievement[]; // This is actually the Role Progression
  };
  clanId?: string;
}

export type WovItemType = "ROLE" | "AVATAR_SET" | "BACKGROUND" | "ITEM" | "LOADING_SCREEN" | "CLAN";
