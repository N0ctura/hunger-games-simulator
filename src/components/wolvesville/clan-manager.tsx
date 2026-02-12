"use client";

import { WovClan, WovClanQuest } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import { useEffect, useState } from "react";
import { Loader2, Shield, Coins, Gem, Sparkles, Search, Users } from "lucide-react";

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

  useEffect(() => {
    async function loadQuests() {
      const data = await WovEngine.getClanQuests();
      setQuests(data);
      setQuestsLoading(false);
    }

    async function initialSearch() {
      try {
        setSearchLoading(true);
        const results = await WovEngine.searchClans("a"); // Initial "top" search
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setHasSearched(true);
    try {
      const results = await WovEngine.searchClans(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Clan search failed", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

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
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Cerca un clan per nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card/30 border border-border rounded-full py-4 pl-12 pr-6 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {searchLoading ? <Loader2 className="animate-spin" size={16} /> : "Cerca"}
            </button>
          </form>

          {hasSearched && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold opacity-80">Risultati ({searchResults.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map(clan => (
                  <div key={clan.id} className="bg-card/20 border border-border rounded-xl p-4 flex items-center gap-4 hover:bg-card/40 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center border border-white/10 shrink-0">
                      {clan.icon ? (
                        // If icon is a URL or ID, handling it properly would be needed, assuming URL for now or generic icon
                        <Users size={20} className="text-muted-foreground" />
                      ) : (
                        <Users size={20} className="text-muted-foreground" />
                      )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quests.map(quest => (
                <div key={quest.id} className="bg-card/20 border border-border rounded-xl p-5 hover:bg-card/40 transition-colors">
                  <h3 className="font-bold text-lg mb-2 text-foreground">{quest.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{quest.description}</p>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ricompense</h4>
                    <div className="flex flex-wrap gap-2">
                      {quest.rewards.map((reward, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm">
                          {reward.type === "GOLD" && <Coins size={14} className="text-yellow-400" />}
                          {reward.type === "GEMS" && <Gem size={14} className="text-pink-400" />}
                          {reward.type === "XP" && <Sparkles size={14} className="text-blue-400" />}
                          <span className="font-mono font-bold">{reward.amount} {reward.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {quests.length === 0 && (
                <div className="col-span-full text-center py-10 opacity-50 border border-dashed border-border rounded-xl">
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
