"use client";

import React, { useState, useRef, useEffect } from "react";
import { Settings, X, RotateCcw, Sun, Moon, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppearance, type ThemePreset } from "@/context/appearance-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ThemeSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    themeMode,
    setThemeMode,
    themePreset,
    setThemePreset,
    particles,
    setParticles,
    background,
    setBackground,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    resetDefaults,
  } = useAppearance();
  
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const presets: { value: ThemePreset; label: string; colors: [string, string] }[] = [
    { value: "celestial", label: "Celestial", colors: ["#f0b90b", "#a855f7"] },
    { value: "forest", label: "Forest", colors: ["#10b981", "#34d399"] },
    { value: "ocean", label: "Ocean", colors: ["#3b82f6", "#06b6d4"] },
    { value: "sunset", label: "Sunset", colors: ["#f59e0b", "#ef4444"] },
    { value: "midnight", label: "Midnight", colors: ["#6366f1", "#8b5cf6"] },
    { value: "custom", label: "Custom", colors: [primaryColor, secondaryColor] },
  ];

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`text-muted-foreground hover:text-primary tap-target h-9 w-9 md:h-auto md:w-auto p-0 md:px-3 ${
          isOpen ? "bg-accent text-accent-foreground" : ""
        }`}
        title="Impostazioni Tema"
      >
        <Palette size={18} className="md:w-5 md:h-5" />
        <span className="ml-1.5 hidden md:inline text-xs">Tema</span>
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 z-50 w-[90vw] max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-primary/20 bg-background/98 backdrop-blur-lg max-h-[80vh] overflow-y-auto custom-scrollbar">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Palette size={18} />
              Personalizza Tema
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-5 pt-4 pb-5">
            {/* Theme Mode Toggle */}
            <div className="space-y-3 p-3 rounded-lg bg-muted/30">
              <Label className="text-sm font-semibold flex items-center gap-2">
                {themeMode === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                Modalità Tema
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  variant={themeMode === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThemeMode("light")}
                  className="flex-1 gap-2"
                >
                  <Sun size={16} />
                  Chiaro
                </Button>
                <Button
                  variant={themeMode === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThemeMode("dark")}
                  className="flex-1 gap-2"
                >
                  <Moon size={16} />
                  Scuro
                </Button>
              </div>
            </div>

            {/* Theme Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Sparkles size={16} />
                Preset Tema
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setThemePreset(preset.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      themePreset === preset.value
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border hover:border-primary/50 bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: preset.colors[0] }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: preset.colors[1] }}
                      />
                    </div>
                    <span className="text-xs font-medium">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabbed Settings */}
            <Tabs defaultValue="background" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="background" className="text-xs">Sfondo</TabsTrigger>
                <TabsTrigger value="particles" className="text-xs">Particelle</TabsTrigger>
                <TabsTrigger value="colors" className="text-xs">Colori</TabsTrigger>
              </TabsList>

              {/* Background Settings */}
              <TabsContent value="background" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="use-gradient" className="text-xs font-semibold">
                      Usa Gradiente
                    </Label>
                    <Switch
                      id="use-gradient"
                      checked={background.useGradient}
                      onCheckedChange={(checked) =>
                        setBackground({ useGradient: checked })
                      }
                    />
                  </div>

                  {background.useGradient ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="gradient-color1" className="text-xs">
                          Colore Gradiente 1
                        </Label>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded border border-border"
                            style={{ backgroundColor: background.gradientColor1 }}
                          />
                          <Input
                            id="gradient-color1"
                            type="color"
                            value={background.gradientColor1}
                            onChange={(e) =>
                              setBackground({ gradientColor1: e.target.value })
                            }
                            className="h-8 flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gradient-color2" className="text-xs">
                          Colore Gradiente 2
                        </Label>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded border border-border"
                            style={{ backgroundColor: background.gradientColor2 }}
                          />
                          <Input
                            id="gradient-color2"
                            type="color"
                            value={background.gradientColor2}
                            onChange={(e) =>
                              setBackground({ gradientColor2: e.target.value })
                            }
                            className="h-8 flex-1"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="bg-color" className="text-xs">
                        Colore Sfondo
                      </Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-border"
                          style={{ backgroundColor: background.backgroundColor }}
                        />
                        <Input
                          id="bg-color"
                          type="color"
                          value={background.backgroundColor}
                          onChange={(e) =>
                            setBackground({ backgroundColor: e.target.value })
                          }
                          className="h-8 flex-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Background Preview */}
                  <div
                    className="h-24 rounded-lg border-2 border-border"
                    style={
                      background.useGradient
                        ? {
                            background: `linear-gradient(180deg, ${background.gradientColor1}, ${background.gradientColor2})`,
                          }
                        : { backgroundColor: background.backgroundColor }
                    }
                  />
                </div>
              </TabsContent>

              {/* Particle Settings */}
              <TabsContent value="particles" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="particle-color1" className="text-xs">
                    Colore Particelle 1
                  </Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full border border-border"
                      style={{ backgroundColor: particles.color1 }}
                    />
                    <Input
                      id="particle-color1"
                      type="color"
                      value={particles.color1}
                      onChange={(e) => {
                        setParticles({ color1: e.target.value });
                        setThemePreset("custom");
                      }}
                      className="h-8 flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="particle-color2" className="text-xs">
                    Colore Particelle 2
                  </Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full border border-border"
                      style={{ backgroundColor: particles.color2 }}
                    />
                    <Input
                      id="particle-color2"
                      type="color"
                      value={particles.color2}
                      onChange={(e) => {
                        setParticles({ color2: e.target.value });
                        setThemePreset("custom");
                      }}
                      className="h-8 flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="density" className="text-xs">Densità</Label>
                    <span className="text-xs text-muted-foreground">{particles.density}</span>
                  </div>
                  <Slider
                    id="density"
                    min={20}
                    max={100}
                    step={5}
                    value={[particles.density]}
                    onValueChange={(vals) => {
                      setParticles({ density: vals[0] });
                      setThemePreset("custom");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="speed" className="text-xs">Velocità</Label>
                    <span className="text-xs text-muted-foreground">{particles.speed.toFixed(1)}</span>
                  </div>
                  <Slider
                    id="speed"
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={[particles.speed]}
                    onValueChange={(vals) => {
                      setParticles({ speed: vals[0] });
                      setThemePreset("custom");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="size" className="text-xs">Dimensione</Label>
                    <span className="text-xs text-muted-foreground">{particles.size.toFixed(1)}</span>
                  </div>
                  <Slider
                    id="size"
                    min={0.5}
                    max={5}
                    step={0.5}
                    value={[particles.size]}
                    onValueChange={(vals) => {
                      setParticles({ size: vals[0] });
                      setThemePreset("custom");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="connection" className="text-xs">Distanza Connessioni</Label>
                    <span className="text-xs text-muted-foreground">{particles.connectionDistance}</span>
                  </div>
                  <Slider
                    id="connection"
                    min={50}
                    max={200}
                    step={10}
                    value={[particles.connectionDistance]}
                    onValueChange={(vals) => {
                      setParticles({ connectionDistance: vals[0] });
                      setThemePreset("custom");
                    }}
                  />
                </div>
              </TabsContent>

              {/* Colors Settings */}
              <TabsContent value="colors" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color" className="text-xs font-semibold">
                    Colore Primario
                  </Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setThemePreset("custom");
                      }}
                      className="h-8 flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usato per pulsanti, link e accenti principali
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color" className="text-xs font-semibold">
                    Colore Secondario
                  </Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <Input
                      id="secondary-color"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => {
                        setSecondaryColor(e.target.value);
                        setThemePreset("custom");
                      }}
                      className="h-8 flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usato per elementi secondari e decorazioni
                  </p>
                </div>

                {/* Color Preview Cards */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-3 rounded-lg text-center text-xs font-medium" style={{ backgroundColor: primaryColor, color: "#fff" }}>
                    Primary
                  </div>
                  <div className="p-3 rounded-lg text-center text-xs font-medium" style={{ backgroundColor: secondaryColor, color: "#fff" }}>
                    Secondary
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Reset Button */}
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={resetDefaults}
                className="w-full text-xs h-9 gap-2"
              >
                <RotateCcw size={14} />
                Ripristina Tutti i Default
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
