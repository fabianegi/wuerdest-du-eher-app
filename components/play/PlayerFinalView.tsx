"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import type { Player } from "@/lib/supabase/types";

interface Props {
  me: Player;
  allPlayers: Player[];
}

// Endstand aus Spielersicht. Zeigt den eigenen Rang in groß,
// die erreichte Punktzahl und einen Link zurück ins Hauptmenü,
// damit eine neue Runde gestartet werden kann.
export default function PlayerFinalView({ me, allPlayers }: Props) {
  // Komplette Liste sortieren, dann eigenen Index suchen (1 basiert).
  const ranked = [...allPlayers].sort((a, b) => b.score - a.score);
  const myRank = ranked.findIndex((p) => p.id === me.id) + 1;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center"
    >
      <div className="stamp text-stone">Endstand</div>
      <div className="text-7xl mt-6">{me.avatar}</div>
      <div className="font-display text-4xl mt-4">{me.nickname}</div>
      <div className="font-mono tabular font-bold text-6xl md:text-8xl mt-4">
        #{myRank}
      </div>
      <div className="stamp text-stone mt-2">von {ranked.length}</div>
      <div className="mt-6 font-mono tabular text-2xl">{me.score} Punkte</div>

      <Link
        href="/"
        className="mt-10 bg-ink text-cream px-6 py-4 font-semibold brut-border inline-flex items-center gap-3 hover:-translate-y-0.5 transition-transform"
      >
        <span>Zurück zum Hauptmenü</span>
        <span aria-hidden>→</span>
      </Link>
    </motion.section>
  );
}
