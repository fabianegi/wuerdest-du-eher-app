"use client";

import { motion } from "framer-motion";

import type { GameQuestionSnapshot } from "@/lib/supabase/types";
import type { Question } from "@/lib/questions";
import Countdown from "@/components/Countdown";

interface Props {
  question: Question | GameQuestionSnapshot;
  tally: { a: number; b: number };
  totalPlayers: number;
  startsAt: string | null;
  duration: number;
  onReveal: () => void;
  onTimeUp: () => void;
  busy: boolean;
}

// Question Ansicht auf dem Beamer (während die Spieler:innen abstimmen).
//   Oben:    die aktuelle Frage und der Countdown (oben rechts).
//   Mitte:   zwei große Felder mit Live Stimmen Anzahl für A und B.
//   Unten:   Fortschrittstext und der "Auflösen" Button.
//
// Der Auflösen Button feuert automatisch, sobald der Countdown
// abläuft (siehe onTimeUp in der Eltern Komponente).
export default function HostQuestionView({
  question,
  tally,
  totalPlayers,
  startsAt,
  duration,
  onReveal,
  onTimeUp,
  busy,
}: Props) {
  const voted = tally.a + tally.b;
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col"
    >
      <div className="flex flex-wrap items-start justify-between gap-6 p-6 md:p-10 border-b-2 border-ink">
        <div className="max-w-3xl">
          <div className="stamp text-stone">Würdest du eher…</div>
          <h1 className="font-display italic text-4xl md:text-6xl leading-tight mt-2">
            {question.a}
            <br />
            <span className="not-italic text-ink/40">oder</span>{" "}
            <span className="">{question.b}?</span>
          </h1>
        </div>
        <Countdown
          startsAt={startsAt}
          duration={duration}
          size={140}
          onExpire={onTimeUp}
        />
      </div>

      <div className="flex-1 grid md:grid-cols-2 gap-0">
        <LiveSide letter="A" label={question.a} count={tally.a} color="#CCFF4D" />
        <LiveSide letter="B" label={question.b} count={tally.b} color="#FF5436" />
      </div>

      <div className="flex items-center justify-between gap-4 p-6 md:p-10 border-t-2 border-ink">
        <div className="stamp text-stone">
          <span className="font-mono text-ink">{voted}</span> / {totalPlayers} abgestimmt
        </div>
        <button
          type="button"
          onClick={onReveal}
          disabled={busy}
          className="bg-ink text-cream px-5 py-3 font-semibold brut-border disabled:opacity-40"
        >
          Auflösen →
        </button>
      </div>
    </motion.section>
  );
}

// Eine der beiden farbigen Live Karten (links A, rechts B).
function LiveSide({
  letter,
  label,
  count,
  color,
}: {
  letter: string;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      className="relative p-8 md:p-12 flex flex-col justify-between min-h-[260px] border-ink"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center justify-between">
        <div className="stamp text-ink/70">Option {letter}</div>
        <div className="font-mono tabular font-bold text-5xl md:text-6xl">
          {count}
        </div>
      </div>
      <div className="font-display text-2xl md:text-4xl leading-tight mt-6">
        {label}
      </div>
    </div>
  );
}
