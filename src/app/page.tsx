"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Swords, Lock, Sparkles, Gamepad2, X } from "lucide-react";
import { ParticleBackground } from "@/components/particle-background";
import { Navbar } from "@/components/navbar";

const games = [
  {
    title: "Hunger Games Simulator",
    description: "Crea la tua arena personalizzata con tributi, eventi e sorprese mortali.",
    icon: Swords,
    href: "/hunger-games",
    available: true,
  },
  {
    title: "Wolvesville Items",
    description: "Lupi mannari e villici in una battaglia notturna di astuzia.",
    icon: Gamepad2,
    href: "/wolvesville",
    available: true,
  },
  {
    title: "Battle Royale",
    description: "100 giocatori, una sola zona sicura. Chi sopravvive?",
    icon: Gamepad2,
    href: "#",
    available: false,
  },
  {
    title: "Arena Gladiatori",
    description: "Combattimenti 1v1 in stile romano con gladiatori leggendari.",
    icon: Gamepad2,
    href: "#",
    available: false,
  },
];

export default function HomePage() {
  const [logo, setLogo] = useState<string | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const router = useRouter();

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "discord") {
      router.push("/hunger-games");
    } else {
      alert("Password errata!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ParticleBackground />
      <Navbar logo={logo} onLogoChange={setLogo} />

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-primary/30 p-6 rounded-xl shadow-2xl w-full max-w-sm relative mx-4">
            <button
              onClick={() => setShowPasswordPrompt(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-4">
              <Lock className="w-10 h-10 text-primary mb-2" />
              <h3 className="text-xl font-bold font-serif gold-text">Accesso Riservato</h3>
              <p className="text-sm text-muted-foreground text-center mb-2">
                Ehi tu! Questa sezione è finita, ma non pensare di ricevere spoiler!Daje Roma! 💛❤️
              </p>

              <form onSubmit={handlePasswordSubmit} className="w-full flex flex-col gap-3">
                <input
                  type="password"
                  placeholder="Inserisci password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-background/50 border border-white/10 rounded-lg px-4 py-2 text-center focus:outline-none focus:border-primary/50 transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50 font-bold py-2 rounded-lg transition-all"
                >
                  Accedi
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-4 pb-12 md:pb-16 pt-12 md:pt-20 text-center">
          <div className="animate-float">
            <Sparkles size={40} className="mx-auto mb-3 md:mb-4 text-primary md:w-12 md:h-12" />
          </div>
          <h1 className="gold-text text-balance font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-wide">
            Celestial Elysium Hub
          </h1>
          <p className="mt-3 md:mt-4 max-w-xl text-sm md:text-base text-balance leading-relaxed text-muted-foreground px-2">
            Il tuo portale gaming definitivo. Scegli il tuo gioco, personalizza tutto
            e condividi le tue avventure con il mondo.
          </p>
        </section>

        {/* Game Selector Grid */}
        <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
          <h2 className="mb-6 md:mb-8 text-center font-serif text-xl md:text-2xl font-bold text-foreground">
            Seleziona un Gioco
          </h2>
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((game) => {
              const Icon = game.icon;
              const content = (
                <div
                  key={game.title}
                  className={`group relative flex flex-col items-center rounded-xl border p-5 md:p-6 text-center transition-all duration-300 ${game.available
                    ? "cursor-pointer border-primary/30 bg-card hover:border-primary hover:shadow-[0_0_30px_hsl(43_90%_55%/0.2)] hover:-translate-y-1"
                    : "cursor-not-allowed pointer-events-none border-border/50 bg-card/50 opacity-50 grayscale"
                    }`}
                >
                  <div
                    className={`mb-3 md:mb-4 flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full ${game.available
                      ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                      : "bg-muted text-muted-foreground"
                      } transition-colors`}
                  >
                    <Icon size={24} className="md:w-7 md:h-7" />
                  </div>
                  <h3 className={`mb-2 font-serif text-base md:text-lg font-semibold ${!game.available ? "text-muted-foreground" : "text-foreground"}`}>
                    {game.title} {!game.available && <span className="text-xs block mt-1">(Coming Soon)</span>}
                  </h3>
                  <p className="text-xs md:text-sm leading-relaxed text-muted-foreground">
                    {game.description}
                  </p>
                  {!game.available && (
                    <div className="mt-3 md:mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock size={12} />
                      <span>Coming Soon</span>
                    </div>
                  )}
                  {game.available && (
                    <div className="mt-3 md:mt-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Sparkles size={12} />
                      Gioca Ora
                    </div>
                  )}
                </div>
              );

              return game.available ? (
                game.title === "Hunger Games Simulator" ? (
                  <div key={game.title} onClick={() => setShowPasswordPrompt(true)} className="cursor-pointer">
                    {content}
                  </div>
                ) : (
                  <Link key={game.title} href={game.href}>
                    {content}
                  </Link>
                )
              ) : (
                <div key={game.title}>{content}</div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/50 py-6">
        <p className="text-center text-sm text-muted-foreground">
          Celestial Elysium Hub - Il portale gaming celeste
        </p>
      </footer>
    </div>
  );
}
