import React, { useState, useEffect } from 'react';
import { useWolvesville } from '@/context/wolvesville-context';
import { Trophy, Medal, Calendar, User, Crown, Search, X } from 'lucide-react';
import { WovEngine } from '@/lib/wov-engine';
import { WovPlayerProfile } from '@/lib/wolvesville-types';

export function RankedDashboard() {
  const { rankedSeason, leaderboard, highscores } = useWolvesville();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'highscores'>('leaderboard');
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<WovPlayerProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const result = await WovEngine.searchPlayer(searchQuery.trim());
      if (result) {
        setSearchResult(result);
      } else {
        setSearchError("Giocatore non trovato.");
      }
    } catch (err) {
      setSearchError("Errore durante la ricerca.");
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
    setSearchError(null);
  };

  // Fetch avatars for the current list (optimized with progressive loading)
  useEffect(() => {
    let isMounted = true;

    const fetchAvatars = async () => {
      const currentList = activeTab === 'leaderboard' ? leaderboard : highscores;
      if (!currentList.length) return;

      // Identify missing avatars
      const missingIds = currentList
        .map(p => p.playerId)
        .filter(id => !avatars[id]);

      if (missingIds.length === 0) return;

      setLoadingAvatars(true);
      
      // Process in chunks (batches) to avoid rate limits and UI freezing
      // Reduced batch size to 5 and increased delay to handle strict API limits
      const BATCH_SIZE = 5;
      
      for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
        if (!isMounted) break;

        const batch = missingIds.slice(i, i + BATCH_SIZE);
        const newAvatarsBatch: Record<string, string> = {};

        // Fetch serially within the batch if needed, but parallel is usually fine with small batches
        // Using Promise.all for the small batch
        await Promise.all(batch.map(async (id) => {
          try {
            const profile = await WovEngine.getPlayerProfile(id);
            if (profile && profile.equippedAvatar && profile.equippedAvatar.url) {
              newAvatarsBatch[id] = profile.equippedAvatar.url;
            }
          } catch (e) {
            console.error(`Failed to fetch avatar for ${id}`, e);
          }
        }));

        if (isMounted) {
          setAvatars(prev => ({ ...prev, ...newAvatarsBatch }));
          // Increased delay between batches to 1s to be very safe
          await new Promise(r => setTimeout(r, 1000)); 
        }
      }

      if (isMounted) setLoadingAvatars(false);
    };

    fetchAvatars();

    return () => { isMounted = false; };
  }, [activeTab, leaderboard, highscores]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Season Banner */}
      {rankedSeason && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-blue-900/50 border border-indigo-500/30 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={200} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                  Stagione {rankedSeason.number}
                </span>
                {new Date() >= new Date(rankedSeason.startTime) && new Date() <= new Date(rankedSeason.endTime) && (
                  <span className="flex items-center gap-1 text-green-400 text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span> LIVE
                  </span>
                )}
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
                Competizione Ranked
              </h2>
              <p className="text-indigo-200 flex items-center gap-2">
                <Calendar size={16} />
                {formatDate(rankedSeason.startTime)} - {formatDate(rankedSeason.endTime)}
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[200px]">
              <div className="text-sm text-gray-400 mb-1">Status Stagione</div>
              <div className="text-lg font-bold text-white">In Corso</div>
              <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo-500 h-full w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Cerca un giocatore per username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/20 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Cercando...' : 'Cerca'}
          </button>
        </form>

        {/* Search Result Card */}
        {searchResult && (
          <div className="mt-4 p-6 bg-card/40 border border-primary/30 rounded-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary/20 bg-black/40 overflow-hidden flex-shrink-0">
                {searchResult.equippedAvatar?.url ? (
                  <img
                    src={searchResult.equippedAvatar.url}
                    alt={searchResult.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <User size={48} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left space-y-4 w-full">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                    {searchResult.username}
                    <span className="text-sm px-2 py-0.5 bg-primary/20 text-primary rounded-full border border-primary/20 font-mono">
                      Lvl {searchResult.level}
                    </span>
                  </h3>
                  {/* <p className="text-sm text-muted-foreground font-mono">ID: {searchResult.id}</p> */}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Vittorie</div>
                    <div className="text-lg font-bold text-green-400">
                      {searchResult.gameStats?.totalWinCount || 0}
                    </div>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sconfitte</div>
                    <div className="text-lg font-bold text-red-400">
                      {searchResult.gameStats?.totalLoseCount || 0}
                    </div>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ranked Skill</div>
                    <div className="text-lg font-bold text-indigo-400">
                      {searchResult.rankedSeasonSkill && searchResult.rankedSeasonSkill > -1
                        ? searchResult.rankedSeasonSkill
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Best Rank</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {searchResult.rankedSeasonBestRank && searchResult.rankedSeasonBestRank > 0
                        ? `#${searchResult.rankedSeasonBestRank}`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {searchError && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
            {searchError}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border/40 pb-1">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-4 text-sm font-bold transition-all relative ${activeTab === 'leaderboard'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <div className="flex items-center gap-2">
            <Trophy size={18} />
            Classifica Stagionale
          </div>
          {activeTab === 'leaderboard' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('highscores')}
          className={`pb-3 px-4 text-sm font-bold transition-all relative ${activeTab === 'highscores'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <div className="flex items-center gap-2">
            <Crown size={18} />
            Hall of Fame (XP)
          </div>
          {activeTab === 'highscores' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-card/20 rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-muted-foreground text-xs uppercase tracking-wider border-b border-border/30">
                <th className="p-4 w-20 text-center">Rank</th>
                <th className="p-4">Giocatore</th>
                <th className="p-4 text-right">{activeTab === 'leaderboard' ? 'Skill Rating' : 'Totale XP'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {(activeTab === 'leaderboard' ? leaderboard : highscores).length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    Nessun dato disponibile per questa classifica.
                  </td>
                </tr>
              ) : (
                (activeTab === 'leaderboard' ? leaderboard : highscores).map((player, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr
                      key={player.playerId || index}
                      className={`
                        hover:bg-primary/5 transition-colors
                        ${rank === 1 ? 'bg-yellow-500/5' : ''}
                        ${rank === 2 ? 'bg-gray-400/5' : ''}
                        ${rank === 3 ? 'bg-amber-700/5' : ''}
                      `}
                    >
                      <td className="p-4 text-center font-bold">
                        {rank === 1 && <span className="text-2xl">🥇</span>}
                        {rank === 2 && <span className="text-2xl">🥈</span>}
                        {rank === 3 && <span className="text-2xl">🥉</span>}
                        {rank > 3 && <span className="text-muted-foreground">#{rank}</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border overflow-hidden ${isTop3 ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
                            }`}>
                            {avatars[player.playerId] ? (
                              <img
                                src={avatars[player.playerId]}
                                alt={player.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={16} />
                            )}
                          </div>
                          <div>
                            <div className={`font-bold ${isTop3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {player.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-lg">
                        {activeTab === 'leaderboard'
                          ? (player.skill || 0).toLocaleString()
                          : (player.xp || 0).toLocaleString()
                        }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
