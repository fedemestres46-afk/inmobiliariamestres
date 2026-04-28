import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { WhatsAppFloatingButton } from "@/components/whatsapp-floating-button";

const bodyFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mestres Inmobiliaria",
  description:
    "Propiedades en Casilda y alrededores con una presentacion cuidada y gestion comercial cercana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <WhatsAppFloatingButton />
      </body>
    </html>
  );
}
