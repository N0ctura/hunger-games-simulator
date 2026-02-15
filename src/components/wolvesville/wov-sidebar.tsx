"use client";

import { cn } from "@/lib/utils";
import { LayoutDashboard, Shirt, User, Users, BookOpen, Trophy, Image as ImageIcon } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "wardrobe", label: "Guardaroba & Item", icon: Shirt },
  { id: "roles", label: "Ruoli", icon: User },
  { id: "roleIcons", label: "Icone Ruolo", icon: ImageIcon },
  { id: "profiles", label: "Cerca Giocatore", icon: User },
  { id: "ranked", label: "Ranked & Classifiche", icon: Trophy },
  { id: "clans", label: "Clan & Quest", icon: Users },
  { id: "wiki", label: "Wiki", icon: BookOpen },
];

export function WovSidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
      <div className="p-4 mb-2">
        <h2 className="text-2xl font-bold font-serif gold-text tracking-tight">Wolvesville DB</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-70">Unofficial Tool</p>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(234,179,8,0.1)] border border-primary/20"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              )}
            >
              <Icon size={18} className={isActive ? "text-primary" : "opacity-70"} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_currentColor]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 opacity-50 text-[10px] text-center">
        v3.4.1 Dev by R0ck
      </div>
    </div>
  );
}
