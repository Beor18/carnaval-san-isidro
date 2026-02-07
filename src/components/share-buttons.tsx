"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Share2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  onExport: () => Promise<Blob | null>;
  disabled?: boolean;
}

export function ShareButtons({ onExport, disabled }: ShareButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare("share" in navigator);
  }, []);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const blob = await onExport();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "carnaval-san-isidro-2026.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error downloading:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    setIsExporting(true);
    try {
      const blob = await onExport();
      if (!blob) return;

      const file = new File([blob], "carnaval-san-isidro-2026.png", {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Carnaval San Isidro 2026",
          text: "Mi foto del Carnaval San Isidro 2026!",
          files: [file],
        });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        // Fallback: download
        await handleDownload();
      }
    } catch (error) {
      // User cancelled share is not an error
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-3 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* Primary share/download button */}
      {canShare ? (
        <Button
          variant="hype"
          size="lg"
          onClick={handleShare}
          disabled={disabled || isExporting}
          className="w-full text-base font-bold relative overflow-hidden btn-glow"
        >
          {isExporting ? (
            <Loader2 className="animate-spin" />
          ) : showSuccess ? (
            <Check />
          ) : (
            <Share2 />
          )}
          {isExporting
            ? "Preparando..."
            : showSuccess
              ? "Listo!"
              : "Compartir en redes"}
        </Button>
      ) : null}

      {/* Download button */}
      <Button
        variant={canShare ? "default" : "hype"}
        size={canShare ? "default" : "lg"}
        onClick={handleDownload}
        disabled={disabled || isExporting}
        className={`w-full font-semibold ${!canShare ? "btn-glow" : ""}`}
      >
        {isExporting ? (
          <Loader2 className="animate-spin" />
        ) : showSuccess ? (
          <Check />
        ) : (
          <Download />
        )}
        {isExporting
          ? "Preparando..."
          : showSuccess
            ? "Descargado!"
            : "Descargar imagen"}
      </Button>

      <p className="text-center text-white/40 text-xs">
        Formato story 1080x1920 - ideal para WhatsApp, Instagram y Facebook
      </p>
    </motion.div>
  );
}
