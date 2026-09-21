import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

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
    <html lang="id" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem("animeku_theme_preference");
                if (t === "light") {
                  document.documentElement.classList.remove("dark", "oled");
                  document.documentElement.classList.add("light");
                  document.documentElement.setAttribute("data-theme", "light");
                } else if (t === "oled") {
                  document.documentElement.classList.remove("light");
                  document.documentElement.classList.add("dark", "oled");
                  document.documentElement.setAttribute("data-theme", "oled");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#141414] text-white min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
