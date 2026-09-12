import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { AuthProvider } from "@/components/AuthContext";
import Header from "@/components/Header";
import OfflineBanner from "@/components/OfflineBanner";

export const metadata: Metadata = {
  title: "Karigar AI - Digital Business Manager for Artisans",
  description: "Turn your craft into a market-ready business with AI-powered catalog generation, smart pricing, buyer matching, and digital storefronts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FAF8F5] text-gray-900 flex flex-col justify-between">
        <AuthProvider>
          <LanguageProvider>
            <Header />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4">
              {children}
            </main>

            <OfflineBanner />

            <footer className="border-t border-[#EADBC8] bg-white py-4 px-4 text-center text-xs text-gray-500">
              <div className="max-w-5xl mx-auto space-y-1">
                <p className="font-medium">Karigar AI © 2026</p>
                <p className="text-gray-400">Empowering Marginalized Indian Artisans with AI Digital Storefronts</p>
              </div>
            </footer>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
