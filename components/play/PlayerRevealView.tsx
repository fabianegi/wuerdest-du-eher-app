"use client";

import { motion } from "framer-motion";

import { scoreRound } from "@/lib/game-helpers";
import type { Vote } from "@/lib/supabase/types";

interface Props {
  question: { a: string; b: string };
  myVote: Vote | null;
  allVotes: Vote[];
}

// =====================================================================
// PlayerRevealView
// ---------------------------------------------------------------------
// Auflösungs Bildschirm aus Spielersicht. Zeigt:
//   1. Die persönliche Punktzahl dieser Runde plus die Begründung
//      ("+20 Teilnahme", "+100 Klare Mehrheit erkannt" usw.).
//   2. Zwei Mini Balken mit dem Gesamtergebnis A vs. B.
//
// Wir berechnen die Punkte hier lokal per scoreRound() noch einmal,
// rein für die Anzeige. Die "wirklichen" Punkte hat schon der Host
// nach der Phase auf "reveal" persistiert (siehe app/host/[gameId]).
// Beide Stellen rechnen identisch, weil scoreRound() eine pure
// Function ist.
// =====================================================================
export default function PlayerRevealView({ question, myVote, allVotes }: Props) {
  const otherVotes = myVote ? allVotes.filter((v) => v.id !== myVote.id) : allVotes;
  const breakdown = scoreRound(
    myVote?.choice ?? null,
    myVote?.prediction ?? null,
    otherVotes,
  );
  const tallyAll = {
    a: allVotes.filter((v) => v.choice === "a").length,
    b: allVotes.filter((v) => v.choice === "b").length,
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="stamp text-stone">Deine Runde</div>

      <motion.h1
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="font-display text-5xl md:text-7xl leading-[0.95] mt-3"
      >
        +{breakdown.total}
        <span className="text-2xl md:text-3xl ml-2 text-stone">Pkt.</span>
      </motion.h1>

      <ul className="mt-6 flex flex-col gap-1 stamp text-ink/80">
        {breakdown.reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <div className="mt-10 grid grid-cols-2 gap-3 max-w-md w-full">
        <MiniBar
          label={question.a}
          count={tallyAll.a}
          total={tallyAll.a + tallyAll.b}
          color="#CCFF4D"
        />
        <MiniBar
          label={question.b}
          count={tallyAll.b}
          total={tallyAll.a + tallyAll.b}
          color="#FF5436"
        />
      </div>
    </motion.section>
  );
}

// Kleine Balken Karte mit Prozent und Label, animiert von 0 % hoch.
function MiniBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      className="relative brut-border overflow-hidden bg-cream"
      style={{ minHeight: 120 }}
    >
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: `${pct}%` }}
        transition={{ duration: 0.9, delay: 0.3 }}
        className="absolute inset-x-0 bottom-0"
        style={{ backgroundColor: color }}
      />
      <div className="relative p-3 flex flex-col h-full">
        <div className="font-mono tabular font-bold text-2xl">{pct}%</div>
        <div className="text-xs mt-auto line-clamp-2 text-left">{label}</div>
      </div>
    </div>
  );
}
