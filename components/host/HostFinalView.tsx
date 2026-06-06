"use client";

import { motion } from "framer-motion";

import type { Player } from "@/lib/supabase/types";
import Confetti from "@/components/Confetti";

interface Props {
  players: Player[];
  onNewGame: () => void;
}

// Endbildschirm auf dem Beamer: Top 3 auf einem ungleich hohen
// Podium (1. Platz größte Karte), die restlichen Plätze als kleinere
// Tabelle darunter. Konfetti wird ausgelöst, sobald die Komponente
// gemountet wird (siehe Confetti).
export default function HostFinalView({ players, onNewGame }: Props) {
  // Spieler:innen nach Punkten absteigend sortieren.
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col p-6 md:p-12"
    >
      <Confetti trigger />
      <div className="stamp text-stone">Finale</div>
      <h1 className="font-display text-5xl md:text-8xl leading-[0.95] mt-2">
        Und gewonnen<br />
        hat<span style={{ color: "#FF5436" }}>…</span>
      </h1>

      <div className="mt-12 grid md:grid-cols-3 gap-4 items-end">
        {top3.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="brut-border-lg bg-cream p-6 flex flex-col items-center text-center"
            style={{
              backgroundColor:
                i === 0 ? "#CCFF4D" : i === 1 ? "#E5DFCB" : "#FF5436",
              minHeight: i === 0 ? 280 : i === 1 ? 240 : 220,
            }}
          >
            <div className="font-mono text-lg">#{i + 1}</div>
            <div className="text-6xl mt-2">{p.avatar}</div>
            <div className="font-display text-3xl mt-3 leading-none">
              {p.nickname}
            </div>
            <div className="font-mono tabular font-bold text-4xl mt-3">
              {p.score}
            </div>
            <div className="stamp text-ink/70 mt-1">Punkte</div>
          </motion.div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="mt-12">
          <div className="stamp text-stone mb-4">Und der Rest</div>
          <ul className="divide-y-2 divide-ink border-2 border-ink bg-cream">
            {rest.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-stone w-8">#{i + 4}</span>
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="font-semibold">{p.nickname}</span>
                </div>
                <span className="font-mono tabular font-bold">{p.score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-12">
        <button
          type="button"
          onClick={onNewGame}
          className="bg-ink text-cream px-6 py-4 font-semibold brut-border-lg"
        >
          Neue Runde starten →
        </button>
      </div>
    </motion.section>
  );
}
