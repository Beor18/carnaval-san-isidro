"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Share2,
  Loader2,
  Check,
  Download,
} from "lucide-react";
import { FrameCanvas, type FrameCanvasHandle } from "./frame-canvas";
import { Particles } from "./particles";
import { InstallPWAButton } from "./install-pwa-button";

const FRAME_URL = "/marco-carnaval.png";

export function PhotoFrameApp() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const canvasRef = useRef<FrameCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Check native share on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanNativeShare(true);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [],
  );

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReset = useCallback(() => {
    setUserImage(null);
  }, []);

  const handleShare = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const blob = await canvasRef.current.exportImage();
      if (!blob) return;

      const file = new File([blob], "carnaval-san-isidro-2026.png", {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Carnaval San Isidro 2026",
          files: [file],
        });
      } else {
        // fallback download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      if ((err as Error).name !== "AbortError") console.error(err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const blob = await canvasRef.current.exportImage();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carnaval-san-isidro-2026.png";
      a.click();
      URL.revokeObjectURL(url);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="bg-carnival-gradient relative min-h-screen min-h-dvh overflow-hidden">
      <InstallPWAButton />
      <Particles count={30} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ---- MAIN LAYOUT ---- */}
      <div className="relative z-10 min-h-screen min-h-dvh flex flex-col items-center justify-between px-4">
        {/* ── HEADER ── */}
        <header 
          className="flex flex-col items-center gap-3 shrink-0"
          style={{ padding: 20 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center justify-center gap-2 bg-black/25 backdrop-blur-sm rounded-full px-4 py-2"
            animate={{ rotate: [0, -1, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wider">
              Carnaval San Isidro 2026
            </span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
            Armá tu foto
          </h1>
        </header>

        {/* ── CANVAS AREA ── */}
        <motion.div
          className="flex-1 w-full max-w-[380px] sm:max-w-[420px] flex items-center justify-center py-4"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <FrameCanvas
            ref={canvasRef}
            userImage={userImage}
            frameUrl={FRAME_URL}
          />
        </motion.div>

        {/* ── BOTTOM ACTIONS ── */}
        <footer 
          className="w-full max-w-[380px] sm:max-w-[420px] shrink-0"
          style={{ padding: 20 }}
        >
          <AnimatePresence mode="wait">
            {!userImage ? (
              /* ---- UPLOAD CTA ---- */
              <motion.div
                key="cta"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="flex justify-center"
              >
                <button
                  type="button"
                  onClick={triggerUpload}
                  className="
                    group w-full max-w-[280px] h-12 rounded-2xl
                    bg-white text-gray-900
                    text-base font-bold
                    flex items-center justify-center gap-3
                    shadow-[0_4px_24px_rgba(0,0,0,0.3)]
                    hover:scale-[1.02] active:scale-[0.97] transition-transform
                    cursor-pointer
                  "
                >
                  <Camera className="w-5 h-5 text-purple-600" />
                  Elegir foto
                </button>
              </motion.div>
            ) : (
              /* ---- ACTION BAR ---- */
              <motion.div
                key="bar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="
                  flex flex-row items-center gap-2.5
                  bg-black/35 backdrop-blur-xl
                  rounded-2xl p-2
                  border border-white/15
                  shadow-[0_4px_24px_rgba(0,0,0,0.25)]
                "
              >
                {/* Change photo */}
                <button
                  type="button"
                  onClick={triggerUpload}
                  className="
                    h-11 w-11 rounded-xl shrink-0
                    bg-white/15 hover:bg-white/25
                    text-white
                    flex items-center justify-center
                    active:scale-95 transition-all cursor-pointer
                  "
                  aria-label="Cambiar foto"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>

                {/* Primary action: Share or Download */}
                <button
                  type="button"
                  onClick={canNativeShare ? handleShare : handleDownload}
                  disabled={isExporting}
                  className="
                    flex-1 h-11 rounded-xl
                    bg-white text-gray-900
                    text-sm font-bold
                    flex items-center justify-center gap-2
                    hover:scale-[1.02] active:scale-95 transition-all cursor-pointer
                    disabled:opacity-60
                    shadow-[0_2px_16px_rgba(255,255,255,0.25)]
                  "
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : showSuccess ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : canNativeShare ? (
                    <Share2 className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isExporting
                    ? "Exportando..."
                    : showSuccess
                    ? "¡Listo!"
                    : canNativeShare
                    ? "Compartir"
                    : "Guardar"}
                </button>

                {/* Reset */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="
                    h-11 w-11 rounded-xl shrink-0
                    bg-white/15 hover:bg-white/25
                    text-white
                    flex items-center justify-center
                    active:scale-95 transition-all cursor-pointer
                  "
                  aria-label="Volver a empezar"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </footer>
      </div>
    </div>
  );
}
