import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Carnaval San Isidro 2026 - Arma tu foto",
  description:
    "Subi tu foto, ponele el marco del Carnaval San Isidro 2026 y compartila en tus redes sociales. WhatsApp, Instagram, Facebook y mas!",
  keywords: [
    "carnaval",
    "san isidro",
    "2026",
    "foto",
    "marco",
    "frame",
    "stories",
    "whatsapp",
  ],
  openGraph: {
    title: "Carnaval San Isidro 2026 - Arma tu foto!",
    description:
      "Ponele el marco del Carnaval a tu foto y compartila en tus historias!",
    type: "website",
    locale: "es_AR",
    siteName: "Carnaval San Isidro 2026",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carnaval San Isidro 2026",
    description: "Arma tu foto con el marco del Carnaval!",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${outfit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
