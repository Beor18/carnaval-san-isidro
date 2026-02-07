"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed in this session
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if installed, dismissed, or no prompt available
  if (isInstalled || dismissed || !showInstallButton) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-4 right-4 z-50 flex justify-center"
      >
        <div
          className="
            flex items-center gap-3
            bg-black/50 backdrop-blur-xl
            rounded-2xl px-4 py-3
            border border-white/20
            shadow-[0_4px_24px_rgba(0,0,0,0.3)]
            max-w-sm w-full
          "
        >
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              Instalá la app
            </p>
            <p className="text-white/60 text-xs truncate">
              Acceso rápido desde tu pantalla
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="
              h-9 px-4 rounded-xl shrink-0
              bg-white text-gray-900
              text-sm font-bold
              flex items-center justify-center gap-2
              hover:scale-[1.02] active:scale-95 transition-all cursor-pointer
            "
          >
            <Download className="w-4 h-4" />
            Instalar
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="
              h-8 w-8 rounded-full shrink-0
              bg-white/10 hover:bg-white/20
              text-white/70 hover:text-white
              flex items-center justify-center
              transition-all cursor-pointer
            "
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
