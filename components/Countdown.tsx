"use client";

import { useEffect, useState } from "react";
import { remainingSeconds } from "@/lib/game-helpers";

interface Props {
  startsAt: string | null;
  duration: number;
  onExpire?: () => void;
  size?: number;
}

// =====================================================================
// Countdown
// ---------------------------------------------------------------------
// Animierter SVG Kreis, der sich entlang seines Umfangs leert,
// während die Zeit läuft. Anker ist der Server Timestamp aus
// games.question_starts_at, dadurch sehen alle Geräte denselben Wert.
//
// Optisches Detail: ab 5 Sekunden wird der Ring korallenrot und
// pulsiert, damit die Spieler:innen merken, dass es eng wird.
// =====================================================================
export default function Countdown({ startsAt, duration, onExpire, size = 140 }: Props) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(startsAt, duration));

  // Wir aktualisieren alle 200 ms, was deutlich häufiger ist als
  // einmal pro Sekunde. Das macht den Ring weicher und gleicht
  // kleine Drift Probleme bei rein zeitbasierten Timern aus.
  useEffect(() => {
    setSeconds(remainingSeconds(startsAt, duration));
    const t = setInterval(() => {
      const s = remainingSeconds(startsAt, duration);
      setSeconds(s);
      if (s <= 0) {
        clearInterval(t);
        onExpire?.();
      }
    }, 200);
    return () => clearInterval(t);
  }, [startsAt, duration, onExpire]);

  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? seconds / duration : 0;
  const offset = circumference * (1 - progress);

  const urgent = seconds <= 5;
  const stroke = urgent ? "#FF5436" : "#0E0E0D";
  const fill = urgent ? "#FF5436" : "#0E0E0D";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className={urgent ? "animate-pulse" : ""}>
        {/* Hintergrund-Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5DFCB"
          strokeWidth={8}
        />
        {/* Aktiver Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 180ms linear, stroke 200ms" }}
        />
      </svg>
      <div
        className="absolute font-mono tabular font-bold"
        style={{ color: fill, fontSize: size * 0.36 }}
      >
        {seconds}
      </div>
    </div>
  );
}
