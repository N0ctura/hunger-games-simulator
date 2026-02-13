
import React, { useState } from 'react';
import { Search, X, User, Trophy, Shield, Clock, Award, Star, Zap, CreditCard } from 'lucide-react';
import { WovEngine } from '@/lib/wov-engine';
import { WovPlayerProfile, WovRole, WovRoleAchievement, WovRoleCard } from '@/lib/wolvesville-types';
import { useWolvesville } from '@/context/wolvesville-context';

// Mappatura delle icone delle abilità (URL statici dal CDN Wolvesville o fallback)
const ABILITY_ICONS: Record<string, string> = {
  // XP Boosts
  'xp-increase-win': 'https://www.wolvesville.com/static/media/ability_icon_xp_boost_win.1d22572ff98a1f18838c.png',
  'xp-increase-quest': 'https://www.wolvesville.com/static/media/ability_icon_xp_boost_quest.1d22572ff98a1f18838c.png',
  'xp-increase-play-with-friends': 'https://www.wolvesville.com/static/media/ability_icon_xp_boost_friends.1d22572ff98a1f18838c.png',
  'xp-increase-bp': 'https://www.wolvesville.com/static/media/ability_icon_xp_boost_battle_pass.1d22572ff98a1f18838c.png',
  'xp-increase-talisman': 'https://www.wolvesville.com/static/media/ability_icon_talisman_boost.0d22572ff98a1f18838c.png',
  'xp-increase-play-with-clan': 'https://www.wolvesville.com/static/media/ability_icon_xp_boost_quest.1d22572ff98a1f18838c.png', // Fallback to quest icon

  // Talismans
  'talismans-no-consume': 'https://www.wolvesville.com/static/media/ability_icon_talismans_no_consume.1d22572ff98a1f18838c.png',
  'talismans-increase-effect': 'https://www.wolvesville.com/static/media/ability_icon_talisman_boost.0d22572ff98a1f18838c.png',

  // Roses
  'rose-increase-received': 'https://www.wolvesville.com/static/media/ability_icon_rose_boost.1d22572ff98a1f18838c.png',
  'rose-single-boost': 'https://www.wolvesville.com/static/media/ability_icon_rose_boost.1d22572ff98a1f18838c.png',
  'rose-single-no-consume': 'https://www.wolvesville.com/static/media/ability_icon_rose_boost.1d22572ff98a1f18838c.png',
  'rose-server-boost': 'https://www.wolvesville.com/static/media/ability_icon_rose_boost.1d22572ff98a1f18838c.png',

  // Others
  'clan-quest-time-reduction': 'https://www.wolvesville.com/static/media/ability_icon_clan_quest_time.1d22572ff98a1f18838c.png',
  'clan-quest-time-increase-by-play-time': 'https://www.wolvesville.com/static/media/ability_icon_clan_quest_time.1d22572ff98a1f18838c.png',
  'chat-stats': 'https://www.wolvesville.com/static/media/ability_icon_xp_boost_win.1d22572ff98a1f18838c.png', // Fallback
  'voting-history': 'https://www.wolvesville.com/static/media/ability_icon_xp_boost_win.1d22572ff98a1f18838c.png', // Fallback
};

// Mappatura dei nomi leggibili delle abilità
const ABILITY_NAMES: Record<string, string> = {
  'xp-increase-win': 'Bonus XP Vittoria',
  'xp-increase-quest': 'Bonus XP Missioni Clan',
  'xp-increase-play-with-friends': 'Bonus XP Amici',
  'xp-increase-bp': 'Bonus XP Battle Pass',
  'xp-increase-talisman': 'Bonus XP Talismani',
  'xp-increase-play-with-clan': 'Bonus XP Giocando con Clan',

  'talismans-no-consume': 'Talismani Infiniti',
  'talismans-increase-effect': 'Potenziamento Talismani',

  'rose-increase-received': 'Bonus Rose Ricevute',
  'rose-single-boost': 'Bonus Rose Singole',
  'rose-single-no-consume': 'Rose Singole Infinite',
  'rose-server-boost': 'Bonus Rose Server',

  'clan-quest-time-reduction': 'Riduzione Tempo Missioni',
  'clan-quest-time-increase-by-play-time': 'Tempo Missioni (Playtime)',
  'chat-stats': 'Statistiche Chat',
  'voting-history': 'Cronologia Voti',
};

// Funzione helper per ottenere l'icona (prova varianti del nome se l'esatto match fallisce)
const getAbilityIcon = (abilityId: string) => {
  if (!abilityId) return null;

  // Rimuovi suffissi numerici (es. "-03") per il matching generico
  // Aggiunto .trim() per sicurezza
  const baseId = abilityId.replace(/-\d+$/, '').trim();

  // Mappa diretta
  if (ABILITY_ICONS[baseId]) return ABILITY_ICONS[baseId];

  // Fallback per icone note basate su parole chiave
  if (baseId.includes('xp')) return 'https://www.wolvesville.com/static/media/ability_icon_xp_boost_win.1d22572ff98a1f18838c.png';
  if (baseId.includes('talisman')) return 'https://www.wolvesville.com/static/media/ability_icon_talisman_boost.0d22572ff98a1f18838c.png';
  if (baseId.includes('rose')) return 'https://www.wolvesville.com/static/media/ability_icon_rose_boost.1d22572ff98a1f18838c.png';

  return null;
};

const getAbilityName = (abilityId: string) => {
  if (!abilityId) return '';
  const baseId = abilityId.replace(/-\d+$/, '').trim();
  return ABILITY_NAMES[baseId] || baseId; // Return baseId to at least remove the number if no name found
};

export function PlayerSearch() {
  const { roles } = useWolvesville();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<WovPlayerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'cards' | 'badges'>('overview');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const searchResult = await WovEngine.searchPlayer(query.trim());

      if (!searchResult) {
        setError("Giocatore non trovato.");
        setLoading(false);
        return;
      }

      const fullProfile = await WovEngine.getPlayerProfile(searchResult.id);

      if (fullProfile) {
        // Preserve personalMessage from searchResult if fullProfile lacks it
        if (!fullProfile.personalMessage && searchResult.personalMessage) {
          fullProfile.personalMessage = searchResult.personalMessage;
        }
        setProfile(fullProfile);
      } else {
        setProfile(searchResult);
      }
    } catch (err) {
      console.error("Profile search error:", err);
      setError("Si è verificato un errore durante la ricerca.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleImage = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.image?.url || null;
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || roleId;
  };

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours.toLocaleString()} ore`;
  };

  // Helper to extract achievements array safely
  const getRoleAchievements = (): WovRoleAchievement[] => {
    if (!profile?.gameStats?.achievements) return [];

    const achievements = profile.gameStats.achievements;
    if (Array.isArray(achievements)) {
      return achievements;
    } else if (typeof achievements === 'object') {
      return Object.values(achievements);
    }
    return [];
  };

  const roleAchievements = getRoleAchievements();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Search Bar */}
      <div className={`transition-all duration-500 ${!profile ? 'py-20 flex flex-col items-center' : ''}`}>
        {!profile && (
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-3xl font-bold font-serif gold-text">Cerca Giocatore</h2>
            <p className="text-muted-foreground">Trova profili, statistiche e carte ruolo</p>
          </div>
        )}

        <form onSubmit={handleSearch} className={`relative w-full ${!profile ? 'max-w-xl' : 'max-w-md'}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Inserisci username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-black/20 border border-border/50 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-lg backdrop-blur-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>

        {loading && (
          <div className="mt-8 flex flex-col items-center gap-2 animate-pulse text-muted-foreground">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-serif">Ricerca in corso...</span>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
      </div>

      {/* Profile View */}
      {profile && !loading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Header Card */}
          <div className="relative overflow-hidden bg-card/40 border border-border/50 rounded-2xl p-6 md:p-10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-primary/20 bg-black/40 overflow-hidden shadow-2xl flex-shrink-0 relative group">
                {profile.equippedAvatar?.url ? (
                  <img
                    src={profile.equippedAvatar.url}
                    alt={profile.username}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <User size={64} />
                  </div>
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-full" />
              </div>

              <div className="flex-1 text-center md:text-left space-y-4 pt-2">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold font-serif gold-text mb-2 tracking-tight">
                    {profile.username}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/20 rounded-full font-mono font-bold text-sm">
                      LVL {profile.level}
                    </span>
                    {profile.clanId && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-full text-sm font-bold flex items-center gap-2">
                        <Shield size={14} />
                        Clan Member
                      </span>
                    )}
                    {profile.rankedSeasonSkill && (
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-full text-sm font-bold flex items-center gap-2">
                        <Trophy size={14} />
                        Skill {profile.rankedSeasonSkill}
                      </span>
                    )}
                  </div>
                </div>

                {profile.personalMessage ? (
                  <p className="text-lg text-gray-300 italic max-w-2xl border-l-4 border-primary/30 pl-4 py-1">
                    "{profile.personalMessage}"
                  </p>
                ) : (
                  <p className="text-muted-foreground italic text-sm">Nessuna biografia disponibile</p>
                )}

                <div className="pt-4 flex flex-col gap-1 text-xs text-muted-foreground font-mono">
                  <span>ID: {profile.id}</span>
                  {profile.lastOnline && (
                    <span>Ultimo accesso: {new Date(profile.lastOnline).toLocaleDateString()}</span>
                  )}
                  {profile.creationTime && (
                    <span>Membro dal: {new Date(profile.creationTime).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center md:justify-start border-b border-border/40 overflow-x-auto">
            {[
              { id: 'overview', label: 'Panoramica', icon: Star },
              { id: 'roles', label: 'Progressi Ruoli', icon: User },
              { id: 'cards', label: 'Carte Equipaggiate', icon: CreditCard },
              { id: 'badges', label: 'Badges', icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(234,179,8,0.5)]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card/20 p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 text-muted-foreground mb-4">
                    <Trophy size={20} className="text-yellow-500" />
                    <span className="text-xs uppercase tracking-wider font-bold">Vittorie Totali</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">
                    {profile.gameStats?.totalWinCount?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-green-400 font-mono">Partite vinte</div>
                </div>

                <div className="bg-card/20 p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 text-muted-foreground mb-4">
                    <X size={20} className="text-red-500" />
                    <span className="text-xs uppercase tracking-wider font-bold">Sconfitte Totali</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">
                    {profile.gameStats?.totalLoseCount?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-red-400 font-mono">Partite perse</div>
                </div>

                <div className="bg-card/20 p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 text-muted-foreground mb-4">
                    <Clock size={20} className="text-blue-500" />
                    <span className="text-xs uppercase tracking-wider font-bold">Tempo di Gioco</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">
                    {formatPlayTime(profile.gameStats?.totalPlayTimeInMinutes || 0)}
                  </div>
                  <div className="text-xs text-blue-400 font-mono">Totale ore</div>
                </div>

                <div className="bg-card/20 p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-colors relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-4 opacity-5">
                    <Award size={100} />
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground mb-4">
                    <Award size={20} className="text-purple-500" />
                    <span className="text-xs uppercase tracking-wider font-bold">Win Rate</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">
                    {profile.gameStats ? (
                      ((profile.gameStats.totalWinCount / (profile.gameStats.totalWinCount + profile.gameStats.totalLoseCount)) * 100).toFixed(1)
                    ) : 0}%
                  </div>
                  <div className="text-xs text-purple-400 font-mono">Percentuale vittorie</div>
                </div>
              </div>
            )}

            {/* ROLE PROGRESSION (LEVELS) */}
            {activeTab === 'roles' && (
              <div>
                {!roleAchievements || roleAchievements.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <User size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nessun progresso ruolo trovato.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {roleAchievements.sort((a, b) => b.level - a.level).map((ach) => {
                      const roleName = getRoleName(ach.roleId);
                      const roleImage = getRoleImage(ach.roleId);

                      return (
                        <div key={ach.roleId} className="bg-card/20 border border-border/50 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-card/40 transition-all group">
                          <div className="w-16 h-16 relative">
                            {roleImage ? (
                              <img src={roleImage} alt={roleName} className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform" />
                            ) : (
                              <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center">
                                <User size={24} className="text-primary/50" />
                              </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-black/80 border border-primary/30 text-primary text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                              Lvl {ach.level}
                            </div>
                          </div>

                          <div className="text-center w-full">
                            <div className="font-bold text-sm truncate w-full" title={roleName}>{roleName}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {ach.points} / {ach.pointsNextLevel} XP
                            </div>
                            <div className="w-full bg-gray-700 h-1 rounded-full mt-2 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (ach.points / ach.pointsNextLevel) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* EQUIPPED CARDS */}
            {activeTab === 'cards' && (
              <div>
                {!profile.roleCards || profile.roleCards.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nessuna carta equipaggiata trovata.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Sort cards by rarity: MYTHICAL > LEGENDARY > EPIC > RARE > COMMON */}
                    {[...profile.roleCards].sort((a, b) => {
                      const rarityWeight = { 'MYTHICAL': 5, 'MYTHIC': 5, 'LEGENDARY': 4, 'EPIC': 3, 'RARE': 2, 'COMMON': 1 };
                      const wA = rarityWeight[a.rarity as keyof typeof rarityWeight] || 0;
                      const wB = rarityWeight[b.rarity as keyof typeof rarityWeight] || 0;
                      return wB - wA;
                    }).map((card, idx) => {
                      // Handle both formats if needed, preferring roleIdBase
                      const baseRole = card.roleIdBase || card.roleId1;
                      const advRoles = card.roleIdsAdvanced || (card.roleId2 ? [card.roleId2] : []);

                      const baseRoleName = getRoleName(baseRole || '');
                      const baseRoleImg = getRoleImage(baseRole || '');

                      // Collect all abilities (up to 5)
                      const abilities = [
                        card.abilityId1,
                        card.abilityId2,
                        card.abilityId3,
                        card.abilityId4,
                        card.abilityId5
                      ].filter(Boolean) as string[];

                      return (
                        <div key={idx} className={`relative p-1 rounded-xl bg-gradient-to-br ${(card.rarity === 'MYTHICAL' || card.rarity === 'MYTHIC') ? 'from-pink-500/50 via-red-500/50 to-purple-900/50 border border-red-500/50' :
                          card.rarity === 'LEGENDARY' ? 'from-yellow-500/50 to-yellow-900/50' :
                            card.rarity === 'EPIC' ? 'from-purple-500/50 to-purple-900/50' :
                              card.rarity === 'RARE' ? 'from-blue-500/50 to-blue-900/50' :
                                'from-gray-500/50 to-gray-900/50'
                          }`}>
                          <div className="bg-black/80 rounded-lg p-4 h-full relative overflow-hidden">
                            {/* Background Icon Opacity */}
                            {baseRoleImg && (
                              <img src={baseRoleImg} className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" alt="" />
                            )}

                            <div className="flex items-start justify-between mb-4 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 relative">
                                  {baseRoleImg ? (
                                    <img src={baseRoleImg} alt={baseRoleName} className="w-full h-full object-contain" />
                                  ) : <User />}
                                </div>
                                <div>
                                  <div className="font-bold text-lg">{baseRoleName}</div>
                                  <div className={`text-xs px-2 py-0.5 rounded-full inline-block border ${(card.rarity === 'MYTHICAL' || card.rarity === 'MYTHIC') ? 'text-pink-400 border-pink-500/30 bg-pink-500/10' :
                                    card.rarity === 'LEGENDARY' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                                      card.rarity === 'EPIC' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                                        card.rarity === 'RARE' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                                          'text-gray-400 border-gray-500/30 bg-gray-500/10'
                                    }`}>
                                    {card.rarity}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {advRoles.length > 0 && (
                              <div className="space-y-2 mb-4 relative z-10">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Ruoli Avanzati</div>
                                <div className="flex flex-wrap gap-2">
                                  {advRoles.map(rId => (
                                    <div key={rId} className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/10">
                                      {getRoleImage(rId) && (
                                        <img src={getRoleImage(rId)!} className="w-6 h-6 object-contain" alt={rId} />
                                      )}
                                      <span className="text-sm">{getRoleName(rId)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {abilities.length > 0 && (
                              <div className="space-y-2 relative z-10">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Abilità ({abilities.length})</div>
                                <div className="space-y-1">
                                  {abilities.map((abilityId, i) => {
                                    const iconUrl = getAbilityIcon(abilityId);
                                    const name = getAbilityName(abilityId);

                                    return (
                                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                        {iconUrl ? (
                                          <img
                                            src={iconUrl}
                                            alt=""
                                            className="w-5 h-5 object-contain"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              const sibling = e.currentTarget.nextElementSibling;
                                              if (sibling) sibling.classList.remove('hidden');
                                            }}
                                          />
                                        ) : null}
                                        <Zap size={14} className={`text-yellow-500 ${iconUrl ? 'hidden' : ''}`} />
                                        <span className="truncate">{name}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="text-center py-20 bg-card/10 rounded-2xl border border-dashed border-border/50">
                <Award size={64} className="mx-auto mb-6 text-muted-foreground/30" />
                <h3 className="text-xl font-bold mb-2">Badge Collezionati: {profile.badgeIds?.length || 0}</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Le icone e i dettagli dei badge non sono ancora disponibili.
                </p>
                {profile.badgeIds && profile.badgeIds.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                    {profile.badgeIds.map(badgeId => (
                      <span key={badgeId} className="px-2 py-1 bg-white/5 rounded border border-white/10 text-xs font-mono text-muted-foreground">
                        {badgeId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
