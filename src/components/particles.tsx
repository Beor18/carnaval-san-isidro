"use client";

import { useMemo, useState, useEffect } from "react";

const CARNIVAL_COLORS = [
  "#facc15", // yellow
  "#f97316", // orange
  "#ec4899", // pink
  "#d946ef", // fuchsia
  "#7c3aed", // purple
  "#06b6d4", // cyan
  "#22c55e", // green
  "#ef4444", // red
];

const SHAPES = ["circle", "square", "triangle"] as const;

interface ParticleData {
  id: number;
  left: number;
  size: number;
  color: string;
  shape: (typeof SHAPES)[number];
  duration: number;
  delay: number;
  swayAmount: number;
}

function generateParticles(count: number): ParticleData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 8 + 6,
    color: CARNIVAL_COLORS[Math.floor(Math.random() * CARNIVAL_COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    duration: Math.random() * 6 + 6,
    delay: Math.random() * 8,
    swayAmount: Math.random() * 40 - 20,
  }));
}

function ParticleShape({
  shape,
  color,
  size,
}: {
  shape: string;
  color: string;
  size: number;
}) {
  if (shape === "circle") {
    return (
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      />
    );
  }

  if (shape === "triangle") {
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
        }}
      />
    );
  }

  // square
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: 2,
      }}
    />
  );
}

export function Particles({ count = 30 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);
  const particles = useMemo(
    () => (mounted ? generateParticles(count) : []),
    [count, mounted]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: 0.7,
          }}
        >
          <div
            style={{
              animation: `sway ${p.duration * 0.8}s ease-in-out ${p.delay}s infinite`,
            }}
          >
            <ParticleShape shape={p.shape} color={p.color} size={p.size} />
          </div>
        </div>
      ))}
    </div>
  );
}
