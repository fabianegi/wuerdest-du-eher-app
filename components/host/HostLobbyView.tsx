"use client";

import { motion } from "framer-motion";

import type { Player } from "@/lib/supabase/types";
import QrCode from "@/components/QrCode";
import PlayerGrid from "@/components/PlayerGrid";
import ScoringRules from "@/components/ScoringRules";

interface Props {
  code: string;
  origin: string;
  players: Player[];
  onStart: () => void;
  busy: boolean;
}

// Lobby Ansicht auf dem Beamer.
//   Links:  QR Code, der 6 stellige Code und der Start Button.
//   Rechts: aktuell beigetretene Spieler:innen plus die Scoring Regeln,
//           damit alle wissen, wofür es Punkte gibt.
// Der Start Button ist gesperrt, solange noch niemand in der Lobby ist.
export default function HostLobbyView({
  code,
  origin,
  players,
  onStart,
  busy,
}: Props) {
  const joinUrl = origin ? `${origin}/play/${code}` : `/play/${code}`;
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid lg:grid-cols-[1fr_1.2fr] flex-1"
    >
      {/* Links: QR + Code */}
      <div className="p-8 lg:p-14 flex flex-col gap-8 border-b-2 lg:border-b-0 lg:border-r-2 border-ink">
        <div>
          <div className="stamp text-stone">Join per QR</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[0.95] mt-2">
            Scan mich.
          </h2>
        </div>

        <div className="flex items-start gap-8 flex-wrap">
          <QrCode value={joinUrl} size={260} />
          <div className="flex flex-col gap-3">
            <div className="stamp text-stone">oder Code eingeben</div>
            <div className="font-mono tabular font-bold text-5xl md:text-7xl tracking-[0.15em]">
              {code}
            </div>
            <div className="stamp text-stone mt-2">auf</div>
            <div className="font-mono text-base md:text-lg break-all">
              {origin.replace(/^https?:\/\//, "") || "lokal"}/play
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={busy || players.length === 0}
          className="mt-auto w-full md:w-auto bg-ink text-cream px-6 py-4 text-lg font-semibold brut-border-lg disabled:opacity-40"
        >
          {players.length === 0
            ? "Warte auf Spieler…"
            : `Spiel starten (${players.length} dabei)`}
        </button>
      </div>

      {/* Rechts: Players + Scoring-Regel */}
      <div className="p-8 lg:p-14 bg-cream flex flex-col gap-8">
        <div>
          <div className="stamp text-stone">In der Lobby</div>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="font-display text-4xl md:text-6xl">
              {players.length}
            </h2>
            <span className="stamp text-stone">
              {players.length === 1 ? "spieler:in" : "spieler:innen"}
            </span>
          </div>

          <div className="mt-6">
            {players.length === 0 ? (
              <div className="text-stone text-lg italic">
                Noch niemand da. Zeig den QR-Code!
              </div>
            ) : (
              <PlayerGrid players={players} />
            )}
          </div>
        </div>

        <div className="max-w-md">
          <ScoringRules />
        </div>
      </div>
    </motion.section>
  );
}
