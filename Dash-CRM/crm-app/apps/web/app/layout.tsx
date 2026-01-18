import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { fontDisplay, fontSans } from "../lib/fonts";

export const metadata: Metadata = {
  title: "Ateliux CRM",
  description: "Ateliux CRM - MVP da Fase 1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${fontSans.variable} ${fontDisplay.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}