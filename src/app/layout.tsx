import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Cinzel } from "next/font/google";
import "@/app/globals.css";
import { AppearanceProvider } from "@/context/appearance-context";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

export const metadata: Metadata = {
  title: "Celestial Elysium Hub",
  description:
    "Portale gaming con simulatore Hunger Games personalizzabile. Crea la tua arena, personalizza tributi ed eventi.",
};

export const viewport: Viewport = {
  themeColor: "#1a0a2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" 
          integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </head>
      <body
        className={`${inter.variable} ${cinzel.variable} font-sans antialiased`}
      >
        <AppearanceProvider>{children}</AppearanceProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
