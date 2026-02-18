"use client";

import { useRef, useState } from "react";
import type { Tribute, GameEvent, GameConfig, SavedGame } from "@/lib/game-types";
import { DEFAULT_CONFIG } from "@/lib/game-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Save, AlertCircle, CheckCircle, FileJson, Trash2 } from "lucide-react";

interface SaveLoadPanelProps {
  tributes: Tribute[];
  events: GameEvent[];
  config: GameConfig;
  onLoad: (data: { tributes: Tribute[]; events: GameEvent[]; config: GameConfig }) => void;
}

type ToastState = { message: string; type: "success" | "error" } | null;

const CURRENT_VERSION = 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripImages(tributes: Tribute[]): SavedGame["tributes"] {
  return tributes.map(({ image: _img, ...rest }) => ({ ...rest, image: null }));
}

function buildSaveData(
  tributes: Tribute[],
  events: GameEvent[],
  config: GameConfig
): SavedGame {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { phaseImages: _pi, ...configWithoutImages } = config;
  return {
    version: CURRENT_VERSION,
    savedAt: new Date().toISOString(),
    tributes: stripImages(tributes),
    events,
    config: configWithoutImages as SavedGame["config"],
  };
}

function downloadJson(data: SavedGame, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function validateSaveData(raw: unknown): raw is SavedGame {
  if (typeof raw !== "object" || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.version !== "number") return false;
  if (!Array.isArray(obj.tributes) || !Array.isArray(obj.events)) return false;
  return true;
}

function parseSaveData(
  save: SavedGame
): { tributes: Tribute[]; events: GameEvent[]; config: GameConfig } {
  // Ricostruisci i tributi con i valori di default per i campi mancanti
  const tributes: Tribute[] = save.tributes.map((t, idx) => ({
    id: t.id || crypto.randomUUID(),
    name: t.name || `Tributo ${idx + 1}`,
    image: null, // le immagini non vengono salvate
    isAlive: true,
    kills: 0,
    district: t.district ?? Math.floor(idx / 2) + 1,
    clan: t.clan ?? `district-${Math.floor(idx / 2) + 1}`,
    usedEvents: [],
  }));

  const events: GameEvent[] = save.events.map((e) => ({
    id: e.id || crypto.randomUUID(),
    text: e.text,
    type: e.type,
    isFatal: e.isFatal ?? false,
    killCount: e.killCount ?? 0,
    killer: e.killer ?? null,
    victims: e.victims ?? [],
    weight: e.weight ?? 5,
  }));

  // Merge config salvata con DEFAULT_CONFIG per campi nuovi aggiunti in futuro
  const config: GameConfig = {
    ...DEFAULT_CONFIG,
    ...save.config,
    phaseImages: DEFAULT_CONFIG.phaseImages, // le immagini usano sempre quelle di default
  };

  return { tributes, events, config };
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SaveLoadPanel({ tributes, events, config, onLoad }: SaveLoadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [importPreview, setImportPreview] = useState<SavedGame | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExport = () => {
    const data = buildSaveData(tributes, events, config);
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(data, `hunger-games-save-${date}.json`);
    showToast(`Salvataggio esportato! (${tributes.length} tributi, ${events.length} eventi)`, "success");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string);
        if (!validateSaveData(raw)) {
          showToast("File non valido. Assicurati di caricare un salvataggio corretto.", "error");
          return;
        }
        setImportPreview(raw);
      } catch {
        showToast("Errore nel leggere il file JSON.", "error");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = () => {
    if (!importPreview) return;
    try {
      const parsed = parseSaveData(importPreview);
      onLoad(parsed);
      setImportPreview(null);
      showToast(
        `Caricato! ${parsed.tributes.length} tributi e ${parsed.events.length} eventi importati. Le immagini non sono state ripristinate.`,
        "success"
      );
    } catch {
      showToast("Errore durante l'importazione.", "error");
      setImportPreview(null);
    }
  };

  const cancelImport = () => {
    setImportPreview(null);
  };

  const savedAt = importPreview?.savedAt
    ? new Date(importPreview.savedAt).toLocaleString("it-IT")
    : null;

  return (
    <Card className="card-game">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif">
          <Save className="text-primary" />
          <span className="gold-text">Salva / Carica Partita</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Esporta tributi, eventi e configurazione in un file <code className="rounded bg-secondary px-1 text-xs">.json</code>.
          Le immagini dei tributi e le immagini di sfondo <strong>non vengono salvate</strong> per mantenere il file leggero.
        </p>

        {/* Export */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Download size={16} className="text-primary" />
            Esporta Partita
          </h4>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>• <strong className="text-foreground">{tributes.length}</strong> tributi (senza immagini)</span>
            <span>• <strong className="text-foreground">{events.length}</strong> eventi ({events.filter(e => e.isFatal).length} fatali)</span>
            <span>• Configurazione corrente</span>
          </div>
          <Button
            onClick={handleExport}
            className="btn-gold w-full"
            disabled={tributes.length === 0 && events.length === 0}
          >
            <Download size={16} className="mr-2" />
            Esporta come JSON
          </Button>
        </div>

        {/* Import */}
        <div className="rounded-lg border border-border/40 bg-secondary/10 p-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Upload size={16} className="text-primary" />
            Importa Partita
          </h4>
          <p className="text-xs text-muted-foreground">
            Carica un file di salvataggio precedentemente esportato. I dati attuali verranno sostituiti.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileJson size={16} className="mr-2" />
            Scegli File JSON
          </Button>
        </div>

        {/* Anteprima importazione */}
        {importPreview && (
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 space-y-3 animate-fade-in">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertCircle size={16} />
              Conferma Importazione
            </h4>
            <div className="text-xs text-muted-foreground space-y-1">
              {savedAt && <p>Salvato il: <strong className="text-foreground">{savedAt}</strong></p>}
              <p>Tributi: <strong className="text-foreground">{importPreview.tributes.length}</strong></p>
              <p>Eventi: <strong className="text-foreground">{importPreview.events.length}</strong></p>
              <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                ⚠️ I dati correnti (tributi, eventi, config) verranno sovrascritti.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmImport} className="btn-gold flex-1">
                <CheckCircle size={16} className="mr-2" />
                Conferma Caricamento
              </Button>
              <Button variant="outline" onClick={cancelImport}>
                <Trash2 size={16} className="mr-1" />
                Annulla
              </Button>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm animate-fade-in ${
              toast.type === "success"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
