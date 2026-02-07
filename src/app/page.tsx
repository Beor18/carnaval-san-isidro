import type { Metadata } from "next";
import { PhotoFrameApp } from "@/components/photo-frame-app";

export const metadata: Metadata = {
  title: "Carnaval San Isidro 2026 - Armá tu foto",
  description:
    "Subí tu foto, ponele el marco del Carnaval San Isidro 2026 y compartila en tus redes sociales. WhatsApp, Instagram, Facebook y más!",
  keywords: [
    "carnaval",
    "san isidro",
    "2026",
    "foto",
    "marco",
    "frame",
    "stories",
    "whatsapp",
    "instagram",
    "compartir",
  ],
  openGraph: {
    title: "Carnaval San Isidro 2026 - ¡Armá tu foto!",
    description:
      "Ponele el marco del Carnaval a tu foto y compartila en tus historias!",
    type: "website",
    locale: "es_AR",
    siteName: "Carnaval San Isidro 2026",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carnaval San Isidro 2026",
    description: "Armá tu foto con el marco del Carnaval!",
  },
};

export default function Home() {
  return <PhotoFrameApp />;
}
