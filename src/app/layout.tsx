import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHINOBI COMMAND — Registre des villages",
  description: "Plateforme de gestion et de suivi des villages shinobi."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}