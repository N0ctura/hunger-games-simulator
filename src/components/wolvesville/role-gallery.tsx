"use client";

import { WovRole } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Search, Shield, Users } from "lucide-react";

interface RoleGalleryProps {
  roles: WovRole[];
}

const TEAM_MAP: Record<string, string> = {
  "VILLAGER": "Villaggio",
  "WEREWOLF": "Lupi",
  "SOLO": "Solitario",
  "RANDOM": "Casuale",
  "VOTING": "Voto"
};

const AURA_MAP: Record<string, string> = {
  "GOOD": "Buona",
  "EVIL": "Malvagia",
  "UNKNOWN": "Sconosciuta",
  "NONE": "Nessuna"
};

export function RoleGallery({ roles }: RoleGalleryProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "BASE" | "ADVANCED">("ALL");

  const safeRoles = Array.isArray(roles) ? roles : Object.values(roles || {});

  const filteredRoles = (safeRoles as WovRole[]).filter((role: WovRole) => {
    const matchesSearch = (role.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (role.team || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "BASE") return !role.isAdvanced;
    if (filterType === "ADVANCED") return role.isAdvanced;

    return true;
  });

  useEffect(() => {
    console.log("[RoleGallery] Received roles:", safeRoles.length, safeRoles[0]);
  }, [safeRoles]);

  if (safeRoles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
        <p className="text-lg font-bold">Nessun ruolo ricevuto dall'API</p>
        <p className="text-sm">Sto usando i dati di backup...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex justify-center gap-2">
        {(["ALL", "BASE", "ADVANCED"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${filterType === type
                ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                : "bg-card/50 text-muted-foreground border-border hover:bg-card hover:text-foreground"
              }`}
          >
            {type === "ALL" ? "Tutti" : type === "BASE" ? "Base" : "Avanzati"}
          </button>
        ))}
      </div>

      <div className="relative max-w-md mx-auto w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Cerca ruolo (es. Veggente, Villico)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card/30 border border-border rounded-full py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRoles.map((role, index) => {
          const teamLabel = TEAM_MAP[role.team || ""] || role.team || "Sconosciuto";
          const auraLabel = AURA_MAP[role.aura || ""] || role.aura;

          return (
            <div key={role.id || `role-${index}`} className="group bg-card/30 border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:bg-card/50 transition-all duration-300 flex flex-col h-full">
              {/* Header: Icon & Title */}
              <div className="flex items-center gap-4 p-4 border-b border-border/50 bg-black/10">
                <div className="relative w-14 h-14 shrink-0 bg-black/20 rounded-lg p-1 border border-white/5 shadow-inner">
                  <Image
                    src={WovEngine.resolveImageUrl(role.id, "role", role.image?.url)}
                    alt={role.name || "Role Image"}
                    fill
                    className="object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">
                    {role.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {/* Team Badge */}
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${role.team === "VILLAGER" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      role.team === "WEREWOLF" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}>
                      <Users size={10} />
                      {teamLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body: Description & Aura */}
              <div className="p-4 flex flex-col gap-3 flex-grow">
                {role.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                    {role.description}
                  </p>
                )}

                {role.aura && (
                  <div className="flex items-center gap-2 text-xs font-medium pt-2 border-t border-border/30">
                    <Shield size={12} className={
                      role.aura === "GOOD" ? "text-green-400" :
                        role.aura === "EVIL" ? "text-red-400" : "text-gray-400"
                    } />
                    <span className="text-muted-foreground">Aura:</span>
                    <span className={
                      role.aura === "GOOD" ? "text-green-400" :
                        role.aura === "EVIL" ? "text-red-400" : "text-gray-400"
                    }>
                      {auraLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-10 opacity-50">Nessun ruolo trovato con questo nome.</div>
      )}
    </div>
  );
}
