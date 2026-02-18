"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import type { AudioConfig } from "@/lib/game-types";
import { DEFAULT_AUDIO_CONFIG } from "@/lib/game-types";

// ─── Generazione suoni con Web Audio API ────────────────────────────────────

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

/** Suono di spada: clang metallico (Procedurale) */
function playSword(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;

  // Tono metallico
  const osc1 = ctx.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(880, now);
  osc1.frequency.exponentialRampToValueAtTime(440, now + 0.3);

  const osc2 = ctx.createOscillator();
  osc2.type = "square";
  osc2.frequency.setValueAtTime(1320, now);
  osc2.frequency.exponentialRampToValueAtTime(660, now + 0.2);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  const compressor = ctx.createDynamicsCompressor();

  osc1.connect(compressor);
  osc2.connect(compressor);
  compressor.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.45);
  osc2.stop(now + 0.35);
}

// ─── Hook principale ─────────────────────────────────────────────────────────

export function useAudio(audioConfig?: Partial<AudioConfig>) {
  const config = { ...DEFAULT_AUDIO_CONFIG, ...audioConfig };
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize ambient audio element
  useEffect(() => {
    const audio = new Audio("/audio/ambiente.mp3");
    audio.loop = true;
    // Validate volume to prevent "non-finite" error
    const rawVolume = Number.isFinite(config.musicVolume)
      ? Math.max(0, Math.min(1, config.musicVolume))
      : DEFAULT_AUDIO_CONFIG.musicVolume;

    // Use exponential curve for better volume control (perceived loudness)
    audio.volume = Math.pow(rawVolume, 2);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const playSound = useCallback((type: "cannon" | "cornucopia") => {
    // Check specific flags for each sound type
    if (type === "cannon" && !config.cannonEnabled) return;
    if (type === "cornucopia" && !config.cornucopiaEnabled) return;
    if (config.sfxVolume <= 0) return;

    switch (type) {
      case "cannon":
        try {
          const cannon = new Audio("/audio/cannone.mp3");
          cannon.volume = config.sfxVolume;
          cannon.play().catch(e => console.log("Cannon play failed:", e));
        } catch (e) {
          console.error("Error creating cannon audio:", e);
        }
        break;

      case "cornucopia": // Suono Fenice all'inizio
        try {
          const fenice = new Audio("/audio/fenice.mp3");
          fenice.volume = config.sfxVolume;
          fenice.play().catch(e => console.log("Fenice play failed:", e));
        } catch (e) {
          console.error("Error creating fenice audio:", e);
        }
        break;
    }
  }, [config]);

  const playAmbient = useCallback(() => {
    if (!audioRef.current || !config.musicEnabled) return;

    if (!audioRef.current.paused) {
      return; // Already playing
    }

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Audio autoplay prevented:", error);
      });
    }
  }, [config.musicEnabled]);

  const stopAmbient = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const pauseAmbient = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // Sync volume changes in real-time
  useEffect(() => {
    if (audioRef.current) {
      const rawVolume = Number.isFinite(config.musicVolume)
        ? Math.max(0, Math.min(1, config.musicVolume))
        : DEFAULT_AUDIO_CONFIG.musicVolume;

      // Use exponential curve for better volume control
      audioRef.current.volume = Math.pow(rawVolume, 2);
    }
  }, [config.musicVolume]);

  // Handle enabled/disabled toggle
  useEffect(() => {
    if (!audioRef.current) return;

    if (!config.musicEnabled) {
      audioRef.current.pause();
    } else if (config.musicEnabled && audioRef.current.paused && audioRef.current.currentTime > 0) {
      // Resume if it was paused but not stopped
      audioRef.current.play().catch(e => console.log("Resume failed:", e));
    }
  }, [config.musicEnabled]);

  return useMemo(() => ({
    playCannon: () => playSound("cannon"),
    playCornucopia: () => playSound("cornucopia"),
    playAmbient,
    stopAmbient,
    pauseAmbient,
  }), [playSound, playAmbient, stopAmbient, pauseAmbient]);
}
