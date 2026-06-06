"use client";

import { motion } from "framer-motion";

import type { GameQuestionSnapshot, ScoringMode } from "@/lib/supabase/types";
import type { Question } from "@/lib/questions";
import VoteResults from "@/components/VoteResults";

interface Props {
  question: Question | GameQuestionSnapshot;
  tally: { a: number; b: number };
  mode: ScoringMode;
  isLast: boolean;
  onNext: () => void;
  busy: boolean;
}

// Auflösung auf dem Beamer.
//   Oben:    die Frage nochmal, damit der Kontext klar bleibt.
//   Mitte:   das große VoteResults Diagramm mit Winner Highlight.
//   Optional: ein "Flavor Text" als kleiner Witz unter dem Diagramm.
//   Unten:   "Nächste Frage" oder, beim letzten Item, "Siegerehrung".
export default function HostRevealView({
  question,
  tally,
  mode,
  isLast,
  onNext,
  busy,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col p-6 md:p-10"
    >
      <div className="stamp text-stone">Ergebnis</div>
      <h1 className="font-display italic text-3xl md:text-5xl leading-tight mt-2 max-w-4xl">
        {question.a}
        <br />
        <span className="not-italic text-ink/40">oder</span> {question.b}?
      </h1>

      <div className="mt-10">
        <VoteResults
          tally={tally}
          labelA={question.a}
          labelB={question.b}
          mode={mode}
          revealWinner
        />
      </div>

      {question.flavor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 text-lg italic text-stone max-w-2xl"
        >
          {question.flavor}
        </motion.div>
      )}

      <div className="mt-auto pt-10 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={busy}
          className="bg-ink text-cream px-6 py-4 text-lg font-semibold brut-border-lg disabled:opacity-40"
        >
          {isLast ? "Siegerehrung →" : "Nächste Frage →"}
        </button>
      </div>
    </motion.section>
  );
}
