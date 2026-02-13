"use client";

import { WovClan, WovClanQuest, ClanSearchOptions } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import { useEffect, useState } from "react";
import { Loader2, Shield, Coins, Gem, Sparkles, Search, Users, Filter, ChevronDown, ChevronUp, Check } from "lucide-react";

export function ClanManager() {
  const [activeTab, setActiveTab] = useState<"search" | "quests">("search");

  // Quest State
  const [quests, setQuests] = useState<WovClanQuest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WovClan[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Advanced Search State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<{
    joinType: "ALL" | "PRIVATE" | "JOIN_BY_REQUEST" | "PUBLIC";
    language: string;
    notFull: boolean;
    minLevel: number;
    sortBy: "XP" | "CREATION_TIME" | "QUEST_HISTORY_COUNT" | "NAME" | "MIN_LEVEL";
  }>({
    joinType: "ALL",
    language: "",
    notFull: false,
    minLevel: 0,
    sortBy: "XP"
  });

  useEffect(() => {
    async function loadQuests() {
      const data = await WovEngine.getClanQuests();
      setQuests(data);
      setQuestsLoading(false);
    }

    async function initialSearch() {
      try {
        setSearchLoading(true);
        // Initial search with just "a" to show something, or maybe empty?
        // Let's keep it simple for now.
        const results = await WovEngine.searchClans("a");
        setSearchResults(results);
        setHasSearched(true);
      } catch (error) {
        console.error("Initial clan search failed", error);
      } finally {
        setSearchLoading(false);
      }
    }

    loadQuests();
    initialSearch();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // if (!searchQuery.trim()) return; // Allow empty search if filters are present? API requires name usually.

    setSearchLoading(true);
    setHasSearched(true);
    try {
      const options: ClanSearchOptions = {
        name: searchQuery,
        sortBy: advancedFilters.sortBy,
        notFull: advancedFilters.notFull,
        minLevel: advancedFilters.minLevel > 0 ? advancedFilters.minLevel : undefined,
        language: advancedFilters.language || undefined,
      };

      if (advancedFilters.joinType !== "ALL") {
        options.joinType = advancedFilters.joinType as any;
      }

      const results = await WovEngine.searchClans(options);
      setSearchResults(results);
    } catch (error) {
      console.error("Clan search failed", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const renderClanIcon = (iconStr?: string, color?: string) => {
    if (!iconStr) return <Users size={20} className="text-muted-foreground" />;

    // Format: font-awesome-5:name:style
    // e.g. font-awesome-5:crosshairs:solid
    if (iconStr.startsWith("font-awesome-5:")) {
      const parts = iconStr.split(":");
      if (parts.length >= 2) {
        const name = parts[1]; // crosshairs
        const style = parts[2] || "solid"; // Default to solid if missing

        let faPrefix = "fas";
        if (style === "solid") faPrefix = "fas";
        else if (style === "regular") faPrefix = "far";
        else if (style === "light") faPrefix = "fal";
        else if (style === "brands") faPrefix = "fab";

        return (
          <i
            className={`${faPrefix} fa-${name} text-xl`}
            style={{ color: color || "#ffffff" }}
          />
        );
      }
    }

    return <Users size={20} className="text-muted-foreground" />;
  };

  const gemQuests = quests.filter(q => q.rewards.some(r => r.type === "GEMS"));
  const goldQuests = quests.filter(q => q.rewards.some(r => r.type === "GOLD") && !q.rewards.some(r => r.type === "GEMS"));
  const otherQuests = quests.filter(q => !q.rewards.some(r => r.type === "GEMS" || r.type === "GOLD"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl text-primary">
            <Shield size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-serif">Clan & Quest</h2>
            <p className="text-muted-foreground">Gestisci le missioni e cerca clan</p>
          </div>
        </div>

        <div className="flex bg-black/20 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "search" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Cerca Clan
          </button>
          <button
            onClick={() => setActiveTab("quests")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "quests" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Quest Attive
          </button>
        </div>
      </div>

      {activeTab === "search" ? (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Cerca un clan per nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card/30 border border-border rounded-xl py-4 pl-12 pr-6 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {searchLoading ? <Loader2 className="animate-spin" size={16} /> : "Cerca"}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Filter size={16} />
                <span>Ricerca Avanzata</span>
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showAdvanced && (
              <div className="bg-card/20 border border-border rounded-xl p-6 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Clan Type */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Tipo Clan</label>
                    <select
                      value={advancedFilters.joinType}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, joinType: e.target.value as any }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary/50"
                    >
                      <option value="ALL">Tutti</option>
                      <option value="PUBLIC">Pubblico</option>
                      <option value="JOIN_BY_REQUEST">Su Richiesta</option>
                      <option value="PRIVATE">Privato / Solo Invito</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Lingua</label>
                    <select
                      value={advancedFilters.language}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary/50"
                    >
                      <option value="">Tutte le lingue</option>
                      <option value="EN">Inglese</option>
                      <option value="DE">Tedesco</option>
                      <option value="FR">Francese</option>
                      <option value="ES">Spagnolo</option>
                      <option value="IT">Italiano</option>
                      <option value="PT">Portoghese</option>
                      <option value="RU">Russo</option>
                      <option value="TR">Turco</option>
                      <option value="PL">Polacco</option>
                    </select>
                  </div>

                  {/* Min Level */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Livello Minimo</label>
                    <input
                      type="number"
                      min="0"
                      value={advancedFilters.minLevel}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minLevel: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Ordina per</label>
                    <select
                      value={advancedFilters.sortBy}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary/50"
                    >
                      <option value="XP">XP</option>
                      <option value="CREATION_TIME">Data di Creazione</option>
                      <option value="QUEST_HISTORY_COUNT">Quest Completate</option>
                      <option value="NAME">Nome</option>
                      <option value="MIN_LEVEL">Livello Richiesto</option>
                    </select>
                  </div>

                  {/* Not Full Checkbox */}
                  <div className="md:col-span-2 flex items-center gap-2 pt-2">
                    <div
                      className={`w-5 h-5 rounded border border-white/20 flex items-center justify-center cursor-pointer transition-colors ${advancedFilters.notFull ? "bg-primary border-primary" : "bg-black/40"}`}
                      onClick={() => setAdvancedFilters(prev => ({ ...prev, notFull: !prev.notFull }))}
                    >
                      {advancedFilters.notFull && <Check size={14} className="text-primary-foreground" />}
                    </div>
                    <span
                      className="text-sm cursor-pointer select-none"
                      onClick={() => setAdvancedFilters(prev => ({ ...prev, notFull: !prev.notFull }))}
                    >
                      Solo clan non pieni
                    </span>
                  </div>
                </div>
              </div>
            )}
          </form>

          {hasSearched && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold opacity-80">Risultati ({searchResults.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map(clan => (
                  <div key={clan.id} className="bg-card/20 border border-border rounded-xl p-4 flex items-center gap-4 hover:bg-card/40 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center border border-white/10 shrink-0">
                      {renderClanIcon(clan.icon, clan.iconColor)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-none mb-1">{clan.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Membri: {clan.memberCount}</span>
                        {clan.language && <span className="uppercase border border-white/10 px-1 rounded">{clan.language}</span>}
                      </div>
                      {clan.description && (
                        <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-1">{clan.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && !searchLoading && (
                  <div className="col-span-full text-center py-10 opacity-50 border border-dashed border-border rounded-xl">
                    Nessun clan trovato con questo nome.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          {questsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse text-muted-foreground">
              <Loader2 className="animate-spin mb-2" />
              <p>Caricamento Clan Quest...</p>
            </div>
          ) : (
            <div className="space-y-12 pb-20">
              {/* Gem Quests */}
              {gemQuests.length > 0 && (
                <section>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-pink-400 border-b border-pink-500/20 pb-2">
                    <Gem className="fill-current" size={24} />
                    Missioni Gemme ({gemQuests.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gemQuests.map(quest => (
                      <div key={quest.id} className="group bg-card/20 border border-border rounded-xl overflow-hidden hover:bg-card/40 hover:border-pink-500/30 transition-all hover:-translate-y-1 duration-300 shadow-lg">
                        {/* Image Preview */}
                        <div className="relative aspect-video w-full bg-black/40">
                          {quest.promoImageUrl ? (
                            <img
                              src={quest.promoImageUrl}
                              alt={quest.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-pink-900/20 to-transparent">
                              <Sparkles size={48} className="opacity-20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="font-bold text-lg text-white leading-tight drop-shadow-md line-clamp-2">{quest.name}</h3>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">{quest.description}</p>

                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Ricompense</h4>
                            <div className="flex flex-wrap gap-2">
                              {quest.rewards.map((reward, i) => (
                                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${reward.type === "GEMS" ? "bg-pink-500/10 border-pink-500/30 text-pink-200" :
                                  reward.type === "GOLD" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-200" :
                                    "bg-black/40 border-white/10 text-muted-foreground"
                                  }`}>
                                  {reward.type === "GOLD" && <Coins size={14} className="text-yellow-400" />}
                                  {reward.type === "GEMS" && <Gem size={14} className="text-pink-400" />}
                                  {reward.type === "XP" && <Sparkles size={14} className="text-blue-400" />}
                                  <span>{reward.amount} {reward.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Gold Quests */}
              {goldQuests.length > 0 && (
                <section>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-yellow-400 border-b border-yellow-500/20 pb-2">
                    <Coins className="fill-current" size={24} />
                    Missioni Oro ({goldQuests.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goldQuests.map(quest => (
                      <div key={quest.id} className="group bg-card/20 border border-border rounded-xl overflow-hidden hover:bg-card/40 hover:border-yellow-500/30 transition-all hover:-translate-y-1 duration-300 shadow-lg">
                        {/* Image Preview */}
                        <div className="relative aspect-video w-full bg-black/40">
                          {quest.promoImageUrl ? (
                            <img
                              src={quest.promoImageUrl}
                              alt={quest.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-yellow-900/20 to-transparent">
                              <Sparkles size={48} className="opacity-20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="font-bold text-lg text-white leading-tight drop-shadow-md line-clamp-2">{quest.name}</h3>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">{quest.description}</p>

                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Ricompense</h4>
                            <div className="flex flex-wrap gap-2">
                              {quest.rewards.map((reward, i) => (
                                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${reward.type === "GEMS" ? "bg-pink-500/10 border-pink-500/30 text-pink-200" :
                                  reward.type === "GOLD" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-200" :
                                    "bg-black/40 border-white/10 text-muted-foreground"
                                  }`}>
                                  {reward.type === "GOLD" && <Coins size={14} className="text-yellow-400" />}
                                  {reward.type === "GEMS" && <Gem size={14} className="text-pink-400" />}
                                  {reward.type === "XP" && <Sparkles size={14} className="text-blue-400" />}
                                  <span>{reward.amount} {reward.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Other Quests */}
              {otherQuests.length > 0 && (
                <section>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-400 border-b border-blue-500/20 pb-2">
                    <Sparkles className="fill-current" size={24} />
                    Altre Missioni ({otherQuests.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherQuests.map(quest => (
                      <div key={quest.id} className="group bg-card/20 border border-border rounded-xl overflow-hidden hover:bg-card/40 transition-all hover:-translate-y-1 duration-300 shadow-lg">
                        {/* Image Preview */}
                        <div className="relative aspect-video w-full bg-black/40">
                          {quest.promoImageUrl ? (
                            <img
                              src={quest.promoImageUrl}
                              alt={quest.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-blue-900/20 to-transparent">
                              <Sparkles size={48} className="opacity-20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="font-bold text-lg text-white leading-tight drop-shadow-md line-clamp-2">{quest.name}</h3>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">{quest.description}</p>
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Ricompense</h4>
                            <div className="flex flex-wrap gap-2">
                              {quest.rewards.map((reward, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm font-bold text-muted-foreground">
                                  <span>{reward.amount} {reward.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {quests.length === 0 && (
                <div className="col-span-full text-center py-20 opacity-50 border border-dashed border-border rounded-xl">
                  Nessuna quest attiva al momento.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
