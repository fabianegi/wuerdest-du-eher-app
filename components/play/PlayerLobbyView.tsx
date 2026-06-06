"use client";

import { motion } from "framer-motion";
import type { Player } from "@/lib/supabase/types";

interface Props {
  players: Player[];
  code: string;
}

// Lobby Bildschirm aus Spielersicht. Zeigt eine Wartemeldung,
// die Anzahl bereits beigetretener Spieler:innen und einen
// dezent wippenden Sanduhr Emoji als optisches Feedback,
// dass die App noch lebt.
export default function PlayerLobbyView({ players, code }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="stamp text-stone">Lobby · Code {code}</div>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mt-3">
        Warte auf<br />den Host<span style={{ color: "#FF5436" }}>.</span>
      </h1>
      <div className="mt-8 text-ink/70 text-lg">
        {players.length} {players.length === 1 ? "Spieler:in" : "Spieler:innen"} dabei
      </div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="mt-12 text-5xl"
        aria-hidden
      >
        ⏳
      </motion.div>
    </motion.section>
  );
}
