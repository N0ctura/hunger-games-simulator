"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";
export type ThemePreset = "celestial" | "forest" | "ocean" | "sunset" | "midnight" | "custom";

interface ParticleSettings {
  color1: string;
  color2: string;
  density: number;
  speed: number;
  size: number;
  connectionDistance: number;
}

interface BackgroundSettings {
  backgroundColor: string;
  gradientColor1: string;
  gradientColor2: string;
  useGradient: boolean;
}

interface AppearanceState {
  // Existing popup settings
  popupColor: string;
  popupOpacity: number;
  textColor: string;
  
  // New theme settings
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  
  // Particle settings
  particles: ParticleSettings;
  
  // Background settings
  background: BackgroundSettings;
  
  // Primary colors
  primaryColor: string;
  secondaryColor: string;
}

interface AppearanceContextType extends AppearanceState {
  setPopupColor: (color: string) => void;
  setPopupOpacity: (opacity: number) => void;
  setTextColor: (color: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemePreset: (preset: ThemePreset) => void;
  setParticles: (particles: Partial<ParticleSettings>) => void;
  setBackground: (background: Partial<BackgroundSettings>) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  resetDefaults: () => void;
  applyPreset: (preset: ThemePreset) => void;
}

const DEFAULT_SETTINGS: AppearanceState = {
  // Popup settings
  popupColor: "#1c1917",
  popupOpacity: 0.9,
  textColor: "#ffffff",
  
  // Theme settings
  themeMode: "dark",
  themePreset: "celestial",
  
  // Particle settings
  particles: {
    color1: "#f0b90b", // Gold
    color2: "#a855f7", // Purple
    density: 50,
    speed: 0.5,
    size: 2,
    connectionDistance: 120,
  },
  
  // Background settings
  background: {
    backgroundColor: "#0f0520",
    gradientColor1: "#0f0520",
    gradientColor2: "#1a0a2e",
    useGradient: true,
  },
  
  // Primary colors
  primaryColor: "#f0b90b",
  secondaryColor: "#a855f7",
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [popupColor, setPopupColorState] = useState(DEFAULT_SETTINGS.popupColor);
  const [popupOpacity, setPopupOpacityState] = useState(DEFAULT_SETTINGS.popupOpacity);
  const [textColor, setTextColorState] = useState(DEFAULT_SETTINGS.textColor);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_SETTINGS.themeMode);
  const [themePreset, setThemePresetState] = useState<ThemePreset>(DEFAULT_SETTINGS.themePreset);
  const [particles, setParticlesState] = useState<ParticleSettings>(DEFAULT_SETTINGS.particles);
  const [background, setBackgroundState] = useState<BackgroundSettings>(DEFAULT_SETTINGS.background);
  const [primaryColor, setPrimaryColorState] = useState(DEFAULT_SETTINGS.primaryColor);
  const [secondaryColor, setSecondaryColorState] = useState(DEFAULT_SETTINGS.secondaryColor);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const savedSettings = localStorage.getItem("appearance-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.popupColor) setPopupColorState(parsed.popupColor);
        if (parsed.popupOpacity !== undefined) setPopupOpacityState(parsed.popupOpacity);
        if (parsed.textColor) setTextColorState(parsed.textColor);
        if (parsed.themeMode) setThemeModeState(parsed.themeMode);
        if (parsed.themePreset) setThemePresetState(parsed.themePreset);
        if (parsed.particles) setParticlesState({ ...DEFAULT_SETTINGS.particles, ...parsed.particles });
        if (parsed.background) setBackgroundState({ ...DEFAULT_SETTINGS.background, ...parsed.background });
        if (parsed.primaryColor) setPrimaryColorState(parsed.primaryColor);
        if (parsed.secondaryColor) setSecondaryColorState(parsed.secondaryColor);
      } catch (e) {
        console.error("Failed to parse appearance settings", e);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        "appearance-settings",
        JSON.stringify({
          popupColor,
          popupOpacity,
          textColor,
          themeMode,
          themePreset,
          particles,
          background,
          primaryColor,
          secondaryColor,
        })
      );
    }
  }, [popupColor, popupOpacity, textColor, themeMode, themePreset, particles, background, primaryColor, secondaryColor, mounted]);

  // Apply theme mode to document
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      if (themeMode === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }
    }
  }, [themeMode, mounted]);

  const setPopupColor = (color: string) => setPopupColorState(color);
  const setPopupOpacity = (opacity: number) => setPopupOpacityState(opacity);
  const setTextColor = (color: string) => setTextColorState(color);
  const setThemeMode = (mode: ThemeMode) => setThemeModeState(mode);
  const setThemePreset = (preset: ThemePreset) => {
    setThemePresetState(preset);
    if (preset !== "custom") {
      applyPreset(preset);
    }
  };
  const setParticles = (newParticles: Partial<ParticleSettings>) =>
    setParticlesState((prev) => ({ ...prev, ...newParticles }));
  const setBackground = (newBackground: Partial<BackgroundSettings>) =>
    setBackgroundState((prev) => ({ ...prev, ...newBackground }));
  const setPrimaryColor = (color: string) => setPrimaryColorState(color);
  const setSecondaryColor = (color: string) => setSecondaryColorState(color);

  const applyPreset = (preset: ThemePreset) => {
    // Don't apply anything for custom preset
    if (preset === "custom") return;

    const presets: Record<Exclude<ThemePreset, "custom">, Partial<AppearanceState>> = {
      celestial: {
        particles: {
          color1: "#f0b90b",
          color2: "#a855f7",
          density: 50,
          speed: 0.5,
          size: 2,
          connectionDistance: 120,
        },
        background: {
          backgroundColor: "#0f0520",
          gradientColor1: "#0f0520",
          gradientColor2: "#1a0a2e",
          useGradient: true,
        },
        primaryColor: "#f0b90b",
        secondaryColor: "#a855f7",
      },
      forest: {
        particles: {
          color1: "#10b981",
          color2: "#34d399",
          density: 60,
          speed: 0.3,
          size: 1.5,
          connectionDistance: 100,
        },
        background: {
          backgroundColor: "#064e3b",
          gradientColor1: "#064e3b",
          gradientColor2: "#047857",
          useGradient: true,
        },
        primaryColor: "#10b981",
        secondaryColor: "#34d399",
      },
      ocean: {
        particles: {
          color1: "#3b82f6",
          color2: "#06b6d4",
          density: 70,
          speed: 0.4,
          size: 2.5,
          connectionDistance: 150,
        },
        background: {
          backgroundColor: "#0c4a6e",
          gradientColor1: "#0c4a6e",
          gradientColor2: "#075985",
          useGradient: true,
        },
        primaryColor: "#3b82f6",
        secondaryColor: "#06b6d4",
      },
      sunset: {
        particles: {
          color1: "#f59e0b",
          color2: "#ef4444",
          density: 55,
          speed: 0.6,
          size: 2,
          connectionDistance: 130,
        },
        background: {
          backgroundColor: "#7c2d12",
          gradientColor1: "#7c2d12",
          gradientColor2: "#991b1b",
          useGradient: true,
        },
        primaryColor: "#f59e0b",
        secondaryColor: "#ef4444",
      },
      midnight: {
        particles: {
          color1: "#6366f1",
          color2: "#8b5cf6",
          density: 40,
          speed: 0.35,
          size: 1.8,
          connectionDistance: 110,
        },
        background: {
          backgroundColor: "#1e1b4b",
          gradientColor1: "#1e1b4b",
          gradientColor2: "#312e81",
          useGradient: true,
        },
        primaryColor: "#6366f1",
        secondaryColor: "#8b5cf6",
      },
    };

    const presetConfig = presets[preset as Exclude<ThemePreset, "custom">];
    if (presetConfig) {
      if (presetConfig.particles) setParticlesState({ ...particles, ...presetConfig.particles });
      if (presetConfig.background) setBackgroundState({ ...background, ...presetConfig.background });
      if (presetConfig.primaryColor) setPrimaryColorState(presetConfig.primaryColor);
      if (presetConfig.secondaryColor) setSecondaryColorState(presetConfig.secondaryColor);
    }
  };

  const resetDefaults = () => {
    setPopupColorState(DEFAULT_SETTINGS.popupColor);
    setPopupOpacityState(DEFAULT_SETTINGS.popupOpacity);
    setTextColorState(DEFAULT_SETTINGS.textColor);
    setThemeModeState(DEFAULT_SETTINGS.themeMode);
    setThemePresetState(DEFAULT_SETTINGS.themePreset);
    setParticlesState(DEFAULT_SETTINGS.particles);
    setBackgroundState(DEFAULT_SETTINGS.background);
    setPrimaryColorState(DEFAULT_SETTINGS.primaryColor);
    setSecondaryColorState(DEFAULT_SETTINGS.secondaryColor);
  };

  return (
    <AppearanceContext.Provider
      value={{
        popupColor,
        popupOpacity,
        textColor,
        themeMode,
        themePreset,
        particles,
        background,
        primaryColor,
        secondaryColor,
        setPopupColor,
        setPopupOpacity,
        setTextColor,
        setThemeMode,
        setThemePreset,
        setParticles,
        setBackground,
        setPrimaryColor,
        setSecondaryColor,
        resetDefaults,
        applyPreset,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
}

// Helper to convert hex to rgba
export function hexToRgba(hex: string, alpha: number): string {
  let r = 0, g = 0, b = 0;
  
  // Handle short hex like #fff
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
