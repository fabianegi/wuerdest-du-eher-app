"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Player } from "@/lib/supabase/types";

interface Props {
  players: Player[];
  highlightId?: string;
}

// Zeigt alle aktuell beigetretenen Spieler:innen als Avatar Chips.
// Über Framer Motion bekommen neue Einträge einen kleinen
// Spring Pop In, damit man sofort sieht, wenn jemand joint.
// Der eigene Eintrag (highlightId) wird zusätzlich limettengrün
// hervorgehoben.
export default function PlayerGrid({ players, highlightId }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <AnimatePresence initial={false}>
        {players.map((p) => {
          const isMe = p.id === highlightId;
          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={
                "flex items-center gap-2 px-3 py-2 brut-border text-ink " +
                (isMe ? "bg-lime" : "bg-cream")
              }
            >
              <span className="text-2xl leading-none">{p.avatar}</span>
              <span className="font-semibold">{p.nickname}</span>
              {isMe && <span className="stamp text-ink/70">du</span>}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
