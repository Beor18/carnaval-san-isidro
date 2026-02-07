"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

// Output size for stories (9:16)
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const ASPECT_RATIO = OUTPUT_WIDTH / OUTPUT_HEIGHT;

export interface FrameCanvasHandle {
  exportImage: () => Promise<Blob | null>;
}

interface FrameCanvasProps {
  userImage: string | null;
  frameUrl: string;
}

const FrameCanvas = forwardRef<FrameCanvasHandle, FrameCanvasProps>(
  ({ userImage, frameUrl }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Image references
    const userImgRef = useRef<HTMLImageElement | null>(null);
    const frameImgRef = useRef<HTMLImageElement | null>(null);

    // Transform state for user image positioning
    const offsetRef = useRef({ x: 0, y: 0 });
    const scaleRef = useRef(1);
    const baseScaleRef = useRef(1);
    const [, forceRender] = useState(0);

    // Drag state
    const dragRef = useRef({
      isDragging: false,
      startX: 0,
      startY: 0,
      lastOffsetX: 0,
      lastOffsetY: 0,
    });

    // Pinch state
    const pinchRef = useRef({
      isPinching: false,
      startDist: 0,
      lastScale: 1,
    });

    // Canvas display size
    const [canvasDisplayWidth, setCanvasDisplayWidth] = useState(300);
    const canvasDisplayHeight = canvasDisplayWidth / ASPECT_RATIO;

    // Calculate size based on available viewport space
    useEffect(() => {
      const calculateSize = () => {
        const container = containerRef.current;
        if (!container) return;

        const containerW = container.clientWidth;
        // Header (~85px) + zoom controls (~36px) + bottom bar (~56px) + gaps (~53px)
        const reservedHeight = 230;
        const availableH = window.innerHeight - reservedHeight;

        const widthFromHeight = availableH * ASPECT_RATIO;
        const width = Math.min(containerW, widthFromHeight, 430);
        setCanvasDisplayWidth(Math.max(Math.floor(width), 200));
      };

      calculateSize();
      window.addEventListener("resize", calculateSize);
      return () => window.removeEventListener("resize", calculateSize);
    }, []);

    // Load frame image and make black pixels transparent
    useEffect(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const offscreen = document.createElement("canvas");
        offscreen.width = img.width;
        offscreen.height = img.height;
        const offCtx = offscreen.getContext("2d");
        if (!offCtx) {
          frameImgRef.current = img;
          drawCanvas();
          return;
        }

        offCtx.drawImage(img, 0, 0);
        const imageData = offCtx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r < 30 && g < 30 && b < 30) {
            data[i + 3] = 0;
          }
        }

        offCtx.putImageData(imageData, 0, 0);

        const processedImg = new Image();
        processedImg.onload = () => {
          frameImgRef.current = processedImg;
          drawCanvas();
        };
        processedImg.src = offscreen.toDataURL("image/png");
      };
      img.src = frameUrl;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [frameUrl]);

    // Load user image
    useEffect(() => {
      if (!userImage) {
        userImgRef.current = null;
        offsetRef.current = { x: 0, y: 0 };
        scaleRef.current = 1;
        baseScaleRef.current = 1;
        forceRender((n) => n + 1);
        drawCanvas();
        return;
      }

      const img = new Image();
      if (!userImage.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        userImgRef.current = img;

        const scaleX = OUTPUT_WIDTH / img.width;
        const scaleY = OUTPUT_HEIGHT / img.height;
        const coverScale = Math.max(scaleX, scaleY);
        baseScaleRef.current = coverScale;
        scaleRef.current = coverScale;

        const scaledW = img.width * coverScale;
        const scaledH = img.height * coverScale;
        offsetRef.current = {
          x: (OUTPUT_WIDTH - scaledW) / 2,
          y: (OUTPUT_HEIGHT - scaledH) / 2,
        };

        forceRender((n) => n + 1);
        drawCanvas();
      };
      img.src = userImage;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userImage]);

    // Draw canvas
    const drawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const userImg = userImgRef.current;
      if (userImg) {
        const s = scaleRef.current;
        const w = userImg.width * s;
        const h = userImg.height * s;
        ctx.drawImage(
          userImg,
          offsetRef.current.x,
          offsetRef.current.y,
          w,
          h
        );
      }

      const frameImg = frameImgRef.current;
      if (frameImg) {
        ctx.drawImage(frameImg, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      }
    }, []);

    // Export final image
    useImperativeHandle(ref, () => ({
      exportImage: async () => {
        drawCanvas();
        const canvas = canvasRef.current;
        if (!canvas) return null;

        return new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
        });
      },
    }));

    // ===== ZOOM CONTROLS =====
    const zoomBy = useCallback(
      (factor: number) => {
        if (!userImgRef.current) return;
        const base = baseScaleRef.current;
        const oldScale = scaleRef.current;
        const newScale = Math.max(
          base * 0.3,
          Math.min(base * 6, oldScale * factor)
        );

        // Zoom toward center of canvas
        const centerX = OUTPUT_WIDTH / 2;
        const centerY = OUTPUT_HEIGHT / 2;
        const ratio = newScale / oldScale;
        offsetRef.current = {
          x: centerX - (centerX - offsetRef.current.x) * ratio,
          y: centerY - (centerY - offsetRef.current.y) * ratio,
        };

        scaleRef.current = newScale;
        forceRender((n) => n + 1);
        drawCanvas();
      },
      [drawCanvas]
    );

    const handleZoomIn = useCallback(() => zoomBy(1.25), [zoomBy]);
    const handleZoomOut = useCallback(() => zoomBy(0.75), [zoomBy]);

    const handleFit = useCallback(() => {
      if (!userImgRef.current) return;
      const img = userImgRef.current;
      const scaleX = OUTPUT_WIDTH / img.width;
      const scaleY = OUTPUT_HEIGHT / img.height;
      const coverScale = Math.max(scaleX, scaleY);
      baseScaleRef.current = coverScale;
      scaleRef.current = coverScale;

      const scaledW = img.width * coverScale;
      const scaledH = img.height * coverScale;
      offsetRef.current = {
        x: (OUTPUT_WIDTH - scaledW) / 2,
        y: (OUTPUT_HEIGHT - scaledH) / 2,
      };

      forceRender((n) => n + 1);
      drawCanvas();
    }, [drawCanvas]);

    // ===== TOUCH HANDLERS =====
    const getDisplayToOutputRatio = useCallback(() => {
      return OUTPUT_WIDTH / canvasDisplayWidth;
    }, [canvasDisplayWidth]);

    const getTouchDistance = (touches: React.TouchList) => {
      const t0 = touches[0];
      const t1 = touches[1];
      const dx = t0.clientX - t1.clientX;
      const dy = t0.clientY - t1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Use native event listeners for touch (to allow preventDefault on passive)
    useEffect(() => {
      const wrapper = canvasRef.current?.parentElement;
      if (!wrapper) return;

      const ratio = () => OUTPUT_WIDTH / canvasDisplayWidth;

      const onTouchStart = (e: TouchEvent) => {
        if (!userImgRef.current) return;
        e.preventDefault();

        if (e.touches.length === 1) {
          dragRef.current = {
            isDragging: true,
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            lastOffsetX: offsetRef.current.x,
            lastOffsetY: offsetRef.current.y,
          };
        } else if (e.touches.length === 2) {
          dragRef.current.isDragging = false;
          const t0 = e.touches[0];
          const t1 = e.touches[1];
          const dx = t0.clientX - t1.clientX;
          const dy = t0.clientY - t1.clientY;
          pinchRef.current = {
            isPinching: true,
            startDist: Math.sqrt(dx * dx + dy * dy),
            lastScale: scaleRef.current,
          };
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!userImgRef.current) return;
        e.preventDefault();

        const r = ratio();

        if (e.touches.length === 1 && dragRef.current.isDragging) {
          const dx =
            (e.touches[0].clientX - dragRef.current.startX) * r;
          const dy =
            (e.touches[0].clientY - dragRef.current.startY) * r;
          offsetRef.current = {
            x: dragRef.current.lastOffsetX + dx,
            y: dragRef.current.lastOffsetY + dy,
          };
          drawCanvas();
          forceRender((n) => n + 1);
        } else if (
          e.touches.length === 2 &&
          pinchRef.current.isPinching
        ) {
          const t0 = e.touches[0];
          const t1 = e.touches[1];
          const dx = t0.clientX - t1.clientX;
          const dy = t0.clientY - t1.clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const scaleRatio = dist / pinchRef.current.startDist;
          const base = baseScaleRef.current;
          const newScale = Math.max(
            base * 0.3,
            Math.min(base * 6, pinchRef.current.lastScale * scaleRatio)
          );
          scaleRef.current = newScale;
          drawCanvas();
          forceRender((n) => n + 1);
        }
      };

      const onTouchEnd = () => {
        dragRef.current.isDragging = false;
        pinchRef.current.isPinching = false;
      };

      wrapper.addEventListener("touchstart", onTouchStart, {
        passive: false,
      });
      wrapper.addEventListener("touchmove", onTouchMove, {
        passive: false,
      });
      wrapper.addEventListener("touchend", onTouchEnd);

      return () => {
        wrapper.removeEventListener("touchstart", onTouchStart);
        wrapper.removeEventListener("touchmove", onTouchMove);
        wrapper.removeEventListener("touchend", onTouchEnd);
      };
    }, [canvasDisplayWidth, drawCanvas]);

    // ===== MOUSE HANDLERS (desktop) =====
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!userImgRef.current) return;
        dragRef.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          lastOffsetX: offsetRef.current.x,
          lastOffsetY: offsetRef.current.y,
        };
      },
      []
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!dragRef.current.isDragging || !userImgRef.current) return;
        const r = getDisplayToOutputRatio();
        const dx = (e.clientX - dragRef.current.startX) * r;
        const dy = (e.clientY - dragRef.current.startY) * r;
        offsetRef.current = {
          x: dragRef.current.lastOffsetX + dx,
          y: dragRef.current.lastOffsetY + dy,
        };
        drawCanvas();
      },
      [getDisplayToOutputRatio, drawCanvas]
    );

    const handleMouseUp = useCallback(() => {
      dragRef.current.isDragging = false;
    }, []);

    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        if (!userImgRef.current) return;
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.95 : 1.05;
        zoomBy(factor);
      },
      [zoomBy]
    );

    // Zoom percentage for display
    const zoomPercent = userImgRef.current
      ? Math.round(
          (scaleRef.current / baseScaleRef.current) * 100
        )
      : 100;

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col items-center justify-center gap-2"
      >
        {/* Canvas area */}
        <div
          className="canvas-wrapper relative frame-glow select-none"
          style={{
            width: canvasDisplayWidth,
            height: canvasDisplayHeight,
            cursor: userImage ? "grab" : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            width={OUTPUT_WIDTH}
            height={OUTPUT_HEIGHT}
            className="w-full h-full rounded-xl"
            style={{
              width: canvasDisplayWidth,
              height: canvasDisplayHeight,
            }}
          />

          {/* Overlay hint when no image */}
          {!userImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/50 px-6">
                <p className="text-lg font-medium">Tu foto va aca</p>
                <p className="text-sm mt-1">
                  Toca el boton de abajo para empezar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Zoom controls - only show when image is loaded */}
        {userImage && (
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
            <button
              type="button"
              onClick={handleZoomOut}
              className="text-white/80 hover:text-white active:scale-90 transition-all p-1 cursor-pointer"
              aria-label="Alejar"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            <span className="text-white/70 text-xs font-mono min-w-[3ch] text-center tabular-nums">
              {zoomPercent}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              className="text-white/80 hover:text-white active:scale-90 transition-all p-1 cursor-pointer"
              aria-label="Acercar"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <div className="w-px h-4 bg-white/20" />

            <button
              type="button"
              onClick={handleFit}
              className="text-white/80 hover:text-white active:scale-90 transition-all p-1 cursor-pointer"
              aria-label="Ajustar"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }
);

FrameCanvas.displayName = "FrameCanvas";

export { FrameCanvas };
