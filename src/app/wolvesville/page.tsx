"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ParticleBackground } from "@/components/particle-background";
import { WolvesvilleProvider, useWolvesville } from "@/context/wolvesville-context";
import { WovSidebar } from "@/components/wolvesville/wov-sidebar";
import { Wardrobe } from "@/components/wolvesville/wardrobe";
import { ItemGrid } from "@/components/wolvesville/item-grid";
import { RoleGallery } from "@/components/wolvesville/role-gallery";
import { ClanManager } from "@/components/wolvesville/clan-manager";
import { WovEngine } from "@/lib/wov-engine";
import { WovRole, WovAvatarItem, WovBackground } from "@/lib/wolvesville-types";
import Image from "next/image";

// --- Main Page Component ---

function WolvesvilleContent() {
  const { roles, items, backgrounds, loading } = useWolvesville();
  const [activeTab, setActiveTab] = useState("wardrobe");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-4xl font-serif font-bold mb-2">Benvenuto su Wolvesville DB</h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Il tuo hub definitivo per esplorare ruoli, creare outfit e gestire le attività del clan.
                  Sincronizzato in tempo reale con i server ufficiali.
                </p>
              </div>
              <div className="absolute -right-10 -bottom-20 opacity-20 rotate-12 pointer-events-none">
                <Image src="https://cdn.wolvesville.com/roleIcons/werewolf.png" width={300} height={300} alt="Werewolf" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card/30 p-6 rounded-xl border border-border">
                <h3 className="text-2xl font-bold mb-1">{roles.length}</h3>
                <p className="text-sm text-muted-foreground">Ruoli Indicizzati</p>
              </div>
              <div className="bg-card/30 p-6 rounded-xl border border-border">
                <h3 className="text-2xl font-bold mb-1">{items.length}</h3>
                <p className="text-sm text-muted-foreground">Oggetti Cosmetici</p>
              </div>
              <div className="bg-card/30 p-6 rounded-xl border border-border">
                <h3 className="text-2xl font-bold mb-1">{backgrounds.length}</h3>
                <p className="text-sm text-muted-foreground">Sfondi Disponibili</p>
              </div>
            </div>
          </div>
        );

      case "wardrobe":
        return (
          <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in duration-500">
            {/* Left: Wardrobe (Sticky on desktop) */}
            <div className="xl:w-80 shrink-0">
              <Wardrobe />
            </div>

            {/* Right: Item Grid */}
            <div className="flex-grow">
              <h2 className="text-2xl font-bold font-serif mb-6">Catalogo Oggetti</h2>
              <ItemGrid items={items} loading={loading} />
            </div>
          </div>
        );

      case "roles":
        return <RoleGallery roles={roles} />;

      case "clans":
        return <ClanManager />;

      case "backgrounds":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {backgrounds.map((bg) => (
              <div key={bg.id} className="group relative aspect-video rounded-xl overflow-hidden border border-border hover:border-primary transition-all">
                <Image
                  src={WovEngine.resolveImageUrl(bg.id, "background", bg.imageUrl)}
                  alt={bg.name || bg.id}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-bold text-white">{bg.name || "Sfondo"}</h3>
                  <span className="text-xs text-gray-400">{bg.rarity}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case "wiki":
        return (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <p className="font-mono text-xl font-bold">test 2.1.8 - Multi-Path CDN</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col md:flex-row">
      <ParticleBackground />

      {/* Mobile Header / Nav Toggle could go here */}
      <div className="md:hidden p-4 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50 flex items-center justify-between">
        <span className="font-bold font-serif gold-text">Wolvesville DB</span>
        {/* Simple mobile nav could be added here */}
      </div>

      {/* Sidebar */}
      <div className="hidden md:block sticky top-0 h-screen overflow-y-auto border-r border-border/50 bg-background/50 backdrop-blur-sm z-40">
        <div className="p-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors text-sm">
            <ArrowLeft size={16} />
            <span>Torna all'Hub</span>
          </Link>
          <WovSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 lg:p-10 relative z-10 overflow-x-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <WolvesvilleProvider>
      <WolvesvilleContent />
    </WolvesvilleProvider>
  );
}
