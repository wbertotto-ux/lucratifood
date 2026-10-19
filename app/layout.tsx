import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const montserrat = localFont({
  src: "./fonts/Montserrat-latin-variable.woff2",
  variable: "--font-montserrat",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lucratifood",
  description: "Custo real dos seus pratos. Margem certa no seu cardápio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
