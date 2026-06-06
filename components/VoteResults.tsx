"use client";

import { motion } from "framer-motion";
import type { Choice, ScoringMode } from "@/lib/supabase/types";
import { winningChoice } from "@/lib/game-helpers";

interface Props {
  tally: { a: number; b: number };
  labelA: string;
  labelB: string;
  mode: ScoringMode;
  highlightWinner?: boolean;
  revealWinner?: boolean;
}

// =====================================================================
// VoteResults
// ---------------------------------------------------------------------
// Großes Doppelbalken Diagramm, das beim Mount von 0 % auf den
// finalen Prozentwert hochwächst. In der Auflösungsphase wird die
// Gewinnerseite voll deckend gefärbt, die Verliererseite leicht
// transparent gedimmt, plus ein "Winner" Stempel oben rechts.
// =====================================================================
export default function VoteResults({
  tally,
  labelA,
  labelB,
  mode,
  revealWinner = true,
}: Props) {
  const total = Math.max(1, tally.a + tally.b);
  const pctA = Math.round((tally.a / total) * 100);
  const pctB = 100 - pctA;
  const winner: Choice | null = revealWinner ? winningChoice(tally, mode) : null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4 md:gap-8">
        <ResultBar
          side="a"
          label={labelA}
          count={tally.a}
          percent={pctA}
          color="#CCFF4D"
          isWinner={winner === "a"}
          isLoser={winner === "b"}
        />
        <ResultBar
          side="b"
          label={labelB}
          count={tally.b}
          percent={pctB}
          color="#FF5436"
          isWinner={winner === "b"}
          isLoser={winner === "a"}
        />
      </div>

      {revealWinner && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-center stamp text-stone"
        >
          Punkte werden individuell vergeben. Jede:r sieht die eigene
          Aufschlüsselung auf dem Handy.
        </motion.div>
      )}
    </div>
  );
}

function ResultBar({
  label,
  count,
  percent,
  color,
  isWinner,
  isLoser,
}: {
  side: Choice;
  label: string;
  count: number;
  percent: number;
  color: string;
  isWinner: boolean;
  isLoser: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isLoser ? 0.45 : 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col brut-border overflow-hidden bg-cream"
      style={{ minHeight: 220 }}
    >
      {/* Animiert von Höhe 0 % auf den echten Prozentwert hoch. */}
      <motion.div
        initial={{ height: "0%" }}
        animate={{ height: `${percent}%` }}
        transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 bottom-0"
        style={{ backgroundColor: color }}
      />
      {isWinner && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: -8 }}
          transition={{ delay: 1.1, type: "spring", stiffness: 260 }}
          className="absolute top-2 right-2 z-10 bg-ink text-cream px-2 py-1 stamp"
        >
          Winner
        </motion.div>
      )}
      <div className="relative z-10 flex flex-1 flex-col justify-between p-5">
        <div className="font-display text-xl md:text-2xl leading-tight text-ink">
          {label}
        </div>
        <div className="flex items-end justify-between">
          <span className="font-mono tabular text-4xl md:text-6xl font-bold text-ink">
            {percent}%
          </span>
          <span className="stamp text-ink/70">{count} Stimmen</span>
        </div>
      </div>
    </motion.div>
  );
}
