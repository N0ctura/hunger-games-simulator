import { WovRole, WovAvatarSet, WovBackground, WovLoadingScreen, WovClanQuest } from "./wolvesville-types";

// Emergency Static Data to prevent UI crashes if API is unreachable
// These are minimal valid objects that satisfy the interfaces

export const FALLBACK_ROLES: WovRole[] = [
  {
    id: "villager",
    name: "Villico (Offline)",
    description: "Trova i lupi mannari e linciali.",
    team: "VILLAGER",
    aura: "GOOD",
    isAdvanced: false,
    image: { url: "https://cdn.wolvesville.com/roleIcons/villager.png", width: 128, height: 128 }
  },
  {
    id: "seer",
    name: "Veggente (Offline)",
    description: "Ogni notte puoi rivelare il ruolo di un giocatore.",
    team: "VILLAGER",
    aura: "GOOD",
    isAdvanced: false,
    image: { url: "https://cdn.wolvesville.com/roleIcons/seer.png", width: 128, height: 128 }
  },
  {
    id: "medium",
    name: "Medium (Offline)",
    description: "Puoi parlare con i morti di notte. Rianimi un giocatore una volta per partita.",
    team: "VILLAGER",
    aura: "GOOD",
    isAdvanced: false,
    image: { url: "https://cdn.wolvesville.com/roleIcons/medium.png", width: 128, height: 128 }
  },
  {
    id: "werewolf",
    name: "Lupo Mannaro (Offline)",
    description: "Uccidi i villici ogni notte.",
    team: "WEREWOLF",
    aura: "EVIL",
    isAdvanced: false,
    image: { url: "https://cdn.wolvesville.com/roleIcons/werewolf.png", width: 128, height: 128 }
  },
  {
    id: "jester",
    name: "Buffone (Offline)",
    description: "Fatti linciare dal villaggio per vincere.",
    team: "SOLO",
    aura: "NEUTRAL",
    isAdvanced: false,
    image: { url: "https://cdn.wolvesville.com/roleIcons/jester.png", width: 128, height: 128 }
  },
  {
    id: "analyst",
    name: "Analista (Offline Avanzato)",
    description: "Analizza i giocatori per scoprire il loro ruolo esatto.",
    team: "VILLAGER",
    aura: "GOOD",
    isAdvanced: true,
    image: { url: "https://cdn.wolvesville.com/roleIcons/analyst.png", width: 128, height: 128 }
  }
];

export const FALLBACK_AVATAR_SETS: WovAvatarSet[] = [
  {
    id: "offline_set",
    name: "Set Offline",
    items: [
      { 
        id: "hat_offline", 
        type: "HAT", 
        rarity: "COMMON", 
        imageUrl: "https://cdn.wolvesville.com/avatarItems/hat_santa_claus.png",
        name: "Cappello Offline"
      },
      { 
        id: "shirt_offline", 
        type: "SHIRT", 
        rarity: "COMMON", 
        imageUrl: "https://cdn.wolvesville.com/avatarItems/shirt_santa_claus.png",
        name: "Maglia Offline"
      }
    ]
  }
];

export const FALLBACK_BACKGROUNDS: WovBackground[] = [
  {
    id: "bg_village_offline",
    name: "Villaggio (Offline)",
    rarity: "COMMON",
    imageUrl: "https://cdn.wolvesville.com/backgrounds/wolvesville_large_day.png",
    imageDayUrl: "https://cdn.wolvesville.com/backgrounds/wolvesville_large_day.png",
    imageNightUrl: "https://cdn.wolvesville.com/backgrounds/wolvesville_large_night.png"
  }
];

export const FALLBACK_LOADING_SCREENS: WovLoadingScreen[] = [
  {
    id: "loading_offline",
    url: "https://cdn.wolvesville.com/backgrounds/wolvesville_large_day.png",
    rarity: "COMMON"
  }
];

export const FALLBACK_CLAN_QUESTS: WovClanQuest[] = [
  {
    id: "quest_offline",
    name: "Quest Offline",
    description: "Impossibile caricare le quest. Controlla la connessione.",
    rewards: [{ type: "GOLD", amount: 100 }]
  }
];
