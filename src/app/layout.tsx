import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Animeku — Pemutar Anime Bergaya Netflix",
  description: "Aplikasi pemutar anime personal dengan tampilan ala Netflix, rak kategori, dan lanjut tonton.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark scroll-smooth">
      <body className="bg-[#141414] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
