"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Timer, Gift, ShoppingBag, Sparkles } from "lucide-react";
import { ParticleBackground } from "@/components/particle-background";
import { WolvesvilleProvider, useWolvesville } from "@/context/wolvesville-context";
import { WovSidebar } from "@/components/wolvesville/wov-sidebar";
import { Wardrobe } from "@/components/wolvesville/wardrobe";
import { ItemGrid } from "@/components/wolvesville/item-grid";
import { RoleGallery } from "@/components/wolvesville/role-gallery";
import { ClanManager } from "@/components/wolvesville/clan-manager";
import { RankedDashboard } from "@/components/wolvesville/ranked-dashboard";
import { PlayerSearch } from "@/components/wolvesville/player-search";
import { WovEngine } from "@/lib/wov-engine";
import { WovRole, WovAvatarItem, WovBackground } from "@/lib/wolvesville-types";
import Image from "next/image";

// --- Main Page Component ---

function WolvesvilleContent() {
  const { roles, items, roleIcons, activeOffers, loading } = useWolvesville();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Allow sidebar to control activeTab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Sidebar visibility logic
  const isSidebarVisible = activeTab !== "wardrobe";

  const renderContent = () => {
    // Universal Header for sub-sections
    const SectionHeader = ({ title }: { title: string }) => (
      <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border/40 animate-in fade-in slide-in-from-left-4 duration-500">
        <button
          onClick={() => setActiveTab("dashboard")}
          className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors group"
          title="Torna alla Dashboard"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <h2 className="text-3xl font-serif font-bold text-foreground">{title}</h2>
      </div>
    );

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden shadow-xl">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                className="bg-card/40 p-6 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setActiveTab("roles")}
              >
                <h3 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors">{roles.length}</h3>
                <p className="text-sm text-muted-foreground">Ruoli Indicizzati</p>
              </div>
              <div
                className="bg-card/40 p-6 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setActiveTab("wardrobe")}
              >
                <h3 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors">{items.length}</h3>
                <p className="text-sm text-muted-foreground">Oggetti Cosmetici</p>
              </div>
              <div
                className="bg-card/40 p-6 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setActiveTab("roleIcons")}
              >
                <h3 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors">{roleIcons.length}</h3>
                <p className="text-sm text-muted-foreground">Icone Ruoli</p>
              </div>

              <div
                className="bg-card/40 p-6 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setActiveTab("ranked")}
              >
                <h3 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors">Ranked</h3>
                <p className="text-sm text-muted-foreground">Classifiche</p>
              </div>
            </div>

            {/* Daily Offers Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-foreground">Offerte del Giorno</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live dal Negozio
                  </p>
                </div>
              </div>

              {activeOffers.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card/20">
                  <p className="text-muted-foreground">Nessuna offerta attiva al momento o caricamento in corso...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="group relative bg-card/40 rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
                    >
                      {/* Promo Image */}
                      <div className="aspect-[2/1] relative overflow-hidden bg-black/20">
                        {offer.promoImageUrl ? (
                          <Image
                            src={offer.promoImageUrl}
                            alt="Offer Promo"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                            <Gift className="w-12 h-12 text-primary/20" />
                          </div>
                        )}

                        {/* Cost Badge */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                          {offer.costInGems ? (
                            <span className="bg-black/60 backdrop-blur border border-pink-500/30 text-pink-400 px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                              💎 {offer.costInGems}
                            </span>
                          ) : null}
                          {offer.costInGold ? (
                            <span className="bg-black/60 backdrop-blur border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                              🪙 {offer.costInGold}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg leading-tight">
                              {(offer.avatarItemSets && offer.avatarItemSets.length > 0)
                                ? offer.avatarItemSets[0].name
                                : "Bundle Speciale"}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Timer size={12} /> Scade presto
                            </p>
                          </div>
                        </div>

                        {/* Rewards Preview */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20">
                          {offer.avatarItemSets?.map(set => (
                            <span key={set.id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 whitespace-nowrap">
                              Set: {set.name}
                            </span>
                          ))}
                          {offer.items?.map(item => (
                            <span key={item.id} className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded border border-secondary/20 whitespace-nowrap">
                              Item: {item.rarity}
                            </span>
                          ))}
                          {offer.rewards?.map((reward, idx) => (
                            <span key={idx} className="text-xs bg-white/5 text-muted-foreground px-2 py-1 rounded border border-white/10 whitespace-nowrap">
                              {reward.amount} {reward.type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "wardrobe":
        return (
          <div className="animate-in fade-in duration-500">
            <SectionHeader title="Guardaroba & Item" />
            <div className="flex flex-col xl:flex-row items-start gap-8">
              {/* Left: Wardrobe (Sticky on desktop) */}
              <div className="xl:w-[450px] shrink-0 xl:sticky xl:top-4 self-start z-50">
                <Wardrobe />
              </div>

              {/* Right: Item Grid */}
              <div className="flex-grow">
                <div className="bg-card/20 rounded-xl border border-border/50 p-1">
                  <ItemGrid items={items} loading={loading} />
                </div>
              </div>
            </div>
          </div>
        );

      case "roles":
        return (
          <div className="animate-in fade-in duration-500">
            <SectionHeader title="Galleria Ruoli" />
            <RoleGallery roles={roles} />
          </div>
        );

      case "clans":
        return (
          <div className="animate-in fade-in duration-500">
            <SectionHeader title="Gestione Clan" />
            <ClanManager />
          </div>
        );

      case "ranked":
        return (
          <div className="animate-in fade-in duration-500">
            <SectionHeader title="Classifiche & Ranked" />
            <RankedDashboard />
          </div>
        );

      case "profiles":
        return (
          <div className="animate-in fade-in duration-500">
            <SectionHeader title="Cerca Giocatore" />
            <PlayerSearch />
          </div>
        );

      case "roleIcons":
        // Group icons by roleId
        const iconsByRole: Record<string, any[]> = {};
        const unassignedIcons: any[] = [];

        roleIcons.forEach(icon => {
          if (icon.roleId) {
            if (!iconsByRole[icon.roleId]) {
              iconsByRole[icon.roleId] = [];
            }
            iconsByRole[icon.roleId].push(icon);
          } else {
            unassignedIcons.push(icon);
          }
        });

        // Get sorted role keys
        const sortedRoleIds = Object.keys(iconsByRole).sort((a, b) => {
          const roleA = roles.find(r => r.id === a);
          const roleB = roles.find(r => r.id === b);
          const nameA = roleA ? roleA.name : a;
          const nameB = roleB ? roleB.name : b;
          return nameA.localeCompare(nameB);
        });

        return (
          <div className="animate-in fade-in duration-500 space-y-8 pb-20">
            <SectionHeader title="Icone Ruoli" />

            {sortedRoleIds.map(roleId => {
              const role = roles.find(r => r.id === roleId);
              const roleName = role ? role.name : roleId;
              const roleIconsGroup = iconsByRole[roleId];

              return (
                <div key={roleId} className="bg-card/20 p-6 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3 mb-4 border-b border-border/30 pb-2">
                    {role && role.image && (
                      <div className="w-8 h-8 relative">
                        <Image src={role.image.url} alt={roleName} fill className="object-contain" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold font-serif capitalize">{roleName}</h3>
                    <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full ml-auto">
                      {roleIconsGroup.length} Varianti
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
                    {roleIconsGroup.map((icon) => (
                      <div key={icon.id} className="group relative aspect-square bg-card/40 rounded-xl flex items-center justify-center border border-border hover:border-primary transition-all shadow-sm hover:shadow-primary/20">
                        <div className="relative w-2/3 h-2/3">
                          <Image
                            src={icon.image.url}
                            alt={icon.id}
                            fill
                            className="object-contain transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${icon.rarity === 'MYTHICAL' || icon.rarity === 'MYTHIC' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                            icon.rarity === 'LEGENDARY' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              icon.rarity === 'EPIC' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                icon.rarity === 'RARE' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                  icon.rarity === 'COMMON' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                                    'bg-white/10 text-white/70 border-white/20'
                            }`}>
                            {icon.rarity ? icon.rarity.substring(0, 1) : "?"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {unassignedIcons.length > 0 && (
              <div className="bg-card/20 p-6 rounded-2xl border border-border/50">
                <h3 className="text-xl font-bold font-serif mb-4">Altro</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
                  {unassignedIcons.map((icon) => (
                    <div key={icon.id} className="group relative aspect-square bg-card/40 rounded-xl flex items-center justify-center border border-border hover:border-primary transition-all shadow-sm hover:shadow-primary/20">
                      <div className="relative w-2/3 h-2/3">
                        <Image
                          src={icon.image.url}
                          alt={icon.id}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "wiki":
        return (
          <div className="animate-in fade-in duration-500">
            <SectionHeader title="Wiki & Changelog" />
            <div className="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-border rounded-xl">
              <p className="font-mono text-xl font-bold">v2.3.0 - Stable</p>
              <p className="mt-2 text-sm">Documentazione in aggiornamento...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      {isSidebarVisible && (
        <WovSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 p-8 overflow-y-auto h-screen custom-scrollbar transition-all duration-300",
        isSidebarVisible ? "ml-64" : "ml-0"
      )}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-serif text-lg">Caricamento Wolvesville DB...</p>
          </div>
        ) : (
          renderContent()
        )}
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
