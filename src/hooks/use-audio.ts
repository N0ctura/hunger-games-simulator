"use client";

import { useRef, useEffect, useCallback } from "react";
import type { AudioConfig } from "@/lib/game-types";
import { DEFAULT_AUDIO_CONFIG } from "@/lib/game-types";

// ─── Generazione suoni con Web Audio API ────────────────────────────────────
// Tutti i suoni sono generati proceduralmente — zero file da scaricare.

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

/** Suono di cannone: boom grave con decadimento */
function playCannon(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;

  // Rumore bianco filtrato (impatto)
  const bufferSize = ctx.sampleRate * 0.6;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 200;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(volume * 3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.7);

  // Onda sinusoidale grave (corpo del cannone)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(volume * 1.5, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.6);
}

/** Suono di spada: clang metallico */
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

/** Suono drammatico di cornucopia: trombe + impatto */
function playCornucopiaFanfare(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now + i * 0.12);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + i * 0.12 + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.55);
  });
}

// ─── Musica di sottofondo generata con oscillatori ──────────────────────────
// Pattern ambientale teso, tipo "arena" — loop di ~8 secondi

function createBackgroundMusic(ctx: AudioContext, volume: number): { start: () => void; stop: () => void } {
  let running = false;
  let nodes: AudioNode[] = [];

  const dronePitches = [55, 82.4, 110]; // A1, E2, A2

  const start = () => {
    if (running) return;
    running = true;

    // Drone continuo
    dronePitches.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = volume * (i === 0 ? 0.15 : 0.08);

      // Lento tremolo
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.3 + i * 0.1;
      lfo.type = "sine";
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = volume * 0.03;

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      lfo.start(ctx.currentTime);

      nodes.push(osc, gain, lfo, lfoGain);
    });

    // Pulse ritmico (percussione bassa)
    const schedulePulse = () => {
      if (!running) return;
      const t = ctx.currentTime;
      const bufSize = ctx.sampleRate * 0.1;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 4);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 120;

      const g = ctx.createGain();
      g.gain.setValueAtTime(volume * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      src.connect(filt);
      filt.connect(g);
      g.connect(ctx.destination);
      src.start(t);
      src.stop(t + 0.15);

      setTimeout(schedulePulse, 2400); // ogni ~2.4s
    };

    setTimeout(schedulePulse, 500);
  };

  const stop = () => {
    running = false;
    nodes.forEach((n) => {
      try {
        (n as AudioBufferSourceNode | OscillatorNode).stop?.();
        n.disconnect();
      } catch { /* già fermato */ }
    });
    nodes = [];
  };

  return { start, stop };
}

// ─── Hook principale ─────────────────────────────────────────────────────────

export function useAudio(audioConfig?: Partial<AudioConfig>) {
  const cfg = { ...DEFAULT_AUDIO_CONFIG, ...audioConfig };
  const ctxRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const musicPlayingRef = useRef(false);

  const getCtx = useCallback((): AudioContext | null => {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playCannonSound = useCallback(() => {
    if (!cfg.cannonEnabled || cfg.sfxVolume === 0) return;
    const ctx = getCtx();
    if (!ctx) return;
    playCannon(ctx, cfg.sfxVolume);
  }, [cfg.cannonEnabled, cfg.sfxVolume, getCtx]);

  const playSwordSound = useCallback(() => {
    if (!cfg.swordEnabled || cfg.sfxVolume === 0) return;
    const ctx = getCtx();
    if (!ctx) return;
    playSword(ctx, cfg.sfxVolume);
  }, [cfg.swordEnabled, cfg.sfxVolume, getCtx]);

  const playCornucopiaSound = useCallback(() => {
    if (!cfg.cornucopiaEnabled || cfg.sfxVolume === 0) return;
    const ctx = getCtx();
    if (!ctx) return;
    playCornucopiaFanfare(ctx, cfg.sfxVolume);
  }, [cfg.cornucopiaEnabled, cfg.sfxVolume, getCtx]);

  const startMusic = useCallback(() => {
    if (!cfg.musicEnabled || cfg.musicVolume === 0) return;
    if (musicPlayingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    musicRef.current = createBackgroundMusic(ctx, cfg.musicVolume);
    musicRef.current.start();
    musicPlayingRef.current = true;
  }, [cfg.musicEnabled, cfg.musicVolume, getCtx]);

  const stopMusic = useCallback(() => {
    if (!musicPlayingRef.current) return;
    musicRef.current?.stop();
    musicPlayingRef.current = false;
    musicRef.current = null;
  }, []);

  // Quando il volume della musica cambia, ricrea il drone
  useEffect(() => {
    if (musicPlayingRef.current) {
      stopMusic();
      // Piccolo delay per evitare click audio
      setTimeout(startMusic, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.musicVolume, cfg.musicEnabled]);

  useEffect(() => {
    return () => {
      stopMusic();
      ctxRef.current?.close();
    };
  }, [stopMusic]);

  return { playCannonSound, playSwordSound, playCornucopiaSound, startMusic, stopMusic };
}
