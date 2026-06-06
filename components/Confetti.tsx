"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Props {
  trigger: boolean;
}

// Feuert Konfetti, sobald trigger auf true wechselt. Zwei Schüsse
// von links und rechts, damit es im Hörsaal von beiden Seiten regnet.
// Läuft zwei einhalb Sekunden lang per requestAnimationFrame.
export default function Confetti({ trigger }: Props) {
  useEffect(() => {
    if (!trigger) return;
    const end = Date.now() + 2500;
    const colors = ["#CCFF4D", "#FF5436", "#2A1740", "#0E0E0D", "#F7F3E7"];
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [trigger]);

  return null;
}
