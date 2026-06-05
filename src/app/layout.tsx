import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSM Intelligence Dashboard — Didask",
  description: "Dashboard de priorisation pour l'équipe CSM/KAM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
