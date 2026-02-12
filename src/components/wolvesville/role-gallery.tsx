"use client";

import { WovRole } from "@/lib/wolvesville-types";
import { WovEngine } from "@/lib/wov-engine";
import Image from "next/image";
import { useState } from "react";
import { Search } from "lucide-react";

interface RoleGalleryProps {
  roles: WovRole[];
}

export function RoleGallery({ roles }: RoleGalleryProps) {
  const [search, setSearch] = useState("");

  const safeRoles = Array.isArray(roles) ? roles : Object.values(roles || {});

  const filteredRoles = safeRoles.filter(role =>
    (role.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (role.team || "").toLowerCase().includes(search.toLowerCase())
  );

  if (safeRoles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
        <p className="text-lg font-bold">Nessun ruolo ricevuto dall'API</p>
        <p className="text-sm">Riprova tra poco o verifica la connessione.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-md mx-auto w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Cerca ruolo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card/30 border border-border rounded-full py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRoles.map((role, index) => (
          <div key={role.id || `role-${index}`} className="group bg-card/30 border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:bg-card/50 transition-all duration-300">
            <div className="flex items-center gap-4 p-4">
              <div className="relative w-16 h-16 shrink-0 bg-black/20 rounded-lg p-2 border border-white/5">
                <Image
                  src={WovEngine.resolveImageUrl(role.id, "role", role.image?.url)}
                  alt={role.name || "Role Image"}
                  fill
                  className="object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">{role.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{role.team}</span>
                  {role.aura && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${role.aura === "GOOD" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                      role.aura === "EVIL" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }`}>
                      {role.aura}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {role.description && (
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {role.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-10 opacity-50">Nessun ruolo trovato.</div>
      )}
    </div>
  );
}
