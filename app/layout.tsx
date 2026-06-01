import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NETTORIA — Devis débarras en ligne",
  description: "Obtenez un devis instantané pour votre débarras avec NETTORIA, spécialiste du débarras en Île-de-France.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
