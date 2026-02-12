"use client";

import Link from "next/link";
import { ArrowLeft, Hammer, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleBackground } from "@/components/particle-background";

export default function WolvesvillePage() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            <ParticleBackground />

            <nav className="relative z-20 border-b border-border/50 bg-background/80 backdrop-blur-md p-4">
                <div className="mx-auto max-w-6xl flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft size={20} />
                        <span>Torna all'Hub</span>
                    </Link>
                    <div className="font-serif text-xl font-bold gold-text">
                        Wolvesville Items
                    </div>
                </div>
            </nav>

            <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 text-center">
                <div className="animate-float mb-8 rounded-full bg-primary/10 p-8 ring-1 ring-primary/20">
                    <Construction size={64} className="text-primary" />
                </div>

                <h1 className="mb-4 font-serif text-4xl font-bold tracking-wide sm:text-5xl">
                    Lavori in Corso
                </h1>

                <p className="max-w-md text-lg text-muted-foreground mb-8 leading-relaxed">
                    Lavori in corso!
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/">
                            <ArrowLeft size={16} />
                            Torna alla Home
                        </Link>
                    </Button>
                </div>
            </main>

            <footer className="relative z-10 border-t border-border/50 py-6">
                <p className="text-center text-sm text-muted-foreground">
                    Celestial Elysium Hub - Wolvesville Items
                </p>
            </footer>
        </div>
    );
}
