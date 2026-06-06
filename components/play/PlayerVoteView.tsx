"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { remainingSeconds } from "@/lib/game-helpers";
import type { Choice, Prediction, Vote } from "@/lib/supabase/types";
import Countdown from "@/components/Countdown";

interface Props {
  question: { a: string; b: string };
  myVote: Vote | null;
  startsAt: string | null;
  duration: number;
  // Wirft bei einem DB Fehler eine Exception, damit wir lokal den
  // Submit Status zurücksetzen und der Spieler:in einen Retry anbieten
  // können.
  onVote: (choice: Choice, prediction: Prediction | null) => Promise<void>;
}

// =====================================================================
// PlayerVoteView
// ---------------------------------------------------------------------
// Abstimmungs Bildschirm mit zwei Schritten:
//   Schritt 1: eigene Wahl zwischen A oder B.
//   Schritt 2: Room Read, was glauben wir, wie die anderen wählen.
//
// Wenn der Countdown abläuft und Schritt 2 noch nicht beantwortet ist,
// schicken wir die Wahl ohne Prognose ab. Dann gibt es zumindest die
// 20 Teilnahme Punkte (siehe scoreRound in lib/game-helpers.ts).
// =====================================================================
export default function PlayerVoteView({
  question,
  myVote,
  startsAt,
  duration,
  onVote,
}: Props) {
  // Lokaler Zähler, der die Buttons deaktiviert, sobald die Zeit
  // wirklich abgelaufen ist. Der Countdown unten rechts ist nur
  // visuell, wir brauchen den Wert aber auch für unsere Logik.
  const [secondsLeft, setSecondsLeft] = useState(() =>
    remainingSeconds(startsAt, duration),
  );
  useEffect(() => {
    setSecondsLeft(remainingSeconds(startsAt, duration));
    const t = setInterval(() => {
      const s = remainingSeconds(startsAt, duration);
      setSecondsLeft(s);
      if (s <= 0) clearInterval(t);
    }, 200);
    return () => clearInterval(t);
  }, [startsAt, duration]);
  const expired = secondsLeft <= 0;

  const [localChoice, setLocalChoice] = useState<Choice | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(choice: Choice, prediction: Prediction | null) {
    if (submitted || myVote) return;
    setSubmitted(true);
    setSubmitError(null);
    try {
      await onVote(choice, prediction);
    } catch (err) {
      // Insert ist gescheitert (z. B. Verbindung weg). Wir setzen
      // den Status zurück, damit der Spieler nochmal tippen kann.
      setSubmitted(false);
      const msg =
        err instanceof Error ? err.message : "Vote konnte nicht gesendet werden.";
      setSubmitError(msg);
    }
  }

  // Sicherheitsnetz: Zeit abgelaufen, Wahl ist getroffen, aber noch
  // nichts an die DB geschickt? Dann schicken wir ohne Prognose ab,
  // damit wenigstens der Teilnahme Punkt zählt.
  useEffect(() => {
    if (expired && localChoice && !submitted && !myVote) {
      submit(localChoice, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col"
    >
      <div className="p-5 flex items-start justify-between gap-4 border-b-2 border-ink">
        <div>
          <div className="stamp text-stone">Würdest du eher…</div>
        </div>
        <Countdown startsAt={startsAt} duration={duration} size={80} />
      </div>

      {submitError && (
        <div
          className="bg-coral text-ink px-5 py-3 text-sm border-b-2 border-ink"
          role="alert"
        >
          Vote konnte nicht gesendet werden: {submitError}. Bitte nochmal
          tippen.
        </div>
      )}

      {myVote ? (
        <WaitingAfterVote
          choice={myVote.choice}
          prediction={myVote.prediction}
          question={question}
        />
      ) : expired && !localChoice ? (
        <TimeExpired question={question} />
      ) : !localChoice ? (
        <VoteStep question={question} onChoose={setLocalChoice} />
      ) : (
        <RoomReadStep
          choice={localChoice}
          question={question}
          expired={expired}
          onSubmit={(prediction) => submit(localChoice, prediction)}
        />
      )}
    </motion.section>
  );
}

// ---------------------------------------------------------------------
// Schritt 1: eigene Wahl zwischen A und B.
// ---------------------------------------------------------------------
function VoteStep({
  question,
  onChoose,
}: {
  question: { a: string; b: string };
  onChoose: (c: Choice) => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-5 pt-4 pb-2 stamp text-stone">
        Schritt 1 · deine ehrliche Wahl
      </div>
      <div className="flex-1 grid grid-rows-2 gap-0">
        <VoteOption
          letter="A"
          label={question.a}
          color="#CCFF4D"
          onClick={() => onChoose("a")}
        />
        <VoteOption
          letter="B"
          label={question.b}
          color="#FF5436"
          onClick={() => onChoose("b")}
        />
      </div>
    </div>
  );
}

function VoteOption({
  letter,
  label,
  color,
  onClick,
}: {
  letter: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative text-left p-6 md:p-10 flex flex-col justify-between border-b-2 border-ink last:border-b-0"
      style={{ backgroundColor: color }}
    >
      <div className="stamp">Option {letter}</div>
      <div className="font-display text-3xl md:text-5xl leading-tight mt-4">
        {label}
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------
// Schritt 2: Prognose, wie die anderen wählen ("Room Read").
// ---------------------------------------------------------------------
function RoomReadStep({
  choice,
  question,
  expired,
  onSubmit,
}: {
  choice: Choice;
  question: { a: string; b: string };
  expired: boolean;
  onSubmit: (prediction: Prediction) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col p-5"
    >
      <div className="stamp text-stone">Schritt 2 · lies den Raum</div>
      <h3 className="font-display text-2xl md:text-3xl mt-1 leading-tight">
        Was wählen die <em>anderen</em>?
      </h3>
      <p className="text-sm text-ink/70 mt-2">
        Deine eigene Wahl zählt hier nicht mit. Nur die anderen.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <PredictionButton
          label={question.a}
          sublabel="Die meisten wählen A"
          color="#CCFF4D"
          onClick={() => onSubmit("a_wins")}
          disabled={expired}
        />
        <PredictionButton
          label="≈ 50/50"
          sublabel="Sehr knappes Rennen"
          color="#E5DFCB"
          onClick={() => onSubmit("tie")}
          disabled={expired}
        />
        <PredictionButton
          label={question.b}
          sublabel="Die meisten wählen B"
          color="#FF5436"
          onClick={() => onSubmit("b_wins")}
          disabled={expired}
        />
      </div>

      <div className="mt-6 stamp text-stone">
        Deine Wahl war „{choice === "a" ? question.a : question.b}"
      </div>
    </motion.div>
  );
}

function PredictionButton({
  label,
  sublabel,
  color,
  onClick,
  disabled,
}: {
  label: string;
  sublabel: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="text-left brut-border px-4 py-3 disabled:opacity-40"
      style={{ backgroundColor: color }}
    >
      <div className="font-display text-lg leading-tight text-ink">{label}</div>
      <div className="stamp text-ink/70 mt-1">{sublabel}</div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------
// Zwischen und Endzustände
// ---------------------------------------------------------------------

// Wird gezeigt, wenn die Zeit ausgelaufen ist, OHNE dass die
// Spieler:in überhaupt etwas getippt hat.
function TimeExpired({ question }: { question: { a: string; b: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="stamp text-stone">Zeit abgelaufen</div>
      <h2 className="font-display text-4xl md:text-5xl mt-3 leading-tight">
        Zu spät<span style={{ color: "#FF5436" }}>.</span>
      </h2>
      <p className="mt-6 text-ink/70 max-w-sm">
        Warte auf den Host, es geht gleich mit der Auflösung von „{question.a}
        " vs. „{question.b}" weiter.
      </p>
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="mt-10 stamp text-stone"
      >
        Gleich geht's weiter…
      </motion.div>
    </motion.div>
  );
}

// "Du hast abgestimmt, bitte warten" Bildschirm. Wird angezeigt,
// solange das Spiel noch in der Frage Phase ist und die Spieler:in
// schon abgestimmt hat.
function WaitingAfterVote({
  choice,
  prediction,
  question,
}: {
  choice: Choice;
  prediction: Prediction | null;
  question: { a: string; b: string };
}) {
  const picked = choice === "a" ? question.a : question.b;
  const color = choice === "a" ? "#CCFF4D" : "#FF5436";
  const predictionLabel =
    prediction === "a_wins"
      ? `Die meisten wählen "${question.a}"`
      : prediction === "b_wins"
        ? `Die meisten wählen "${question.b}"`
        : prediction === "tie"
          ? "≈ 50/50, sehr knapp"
          : "(keine Prognose)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="stamp text-stone">Du hast abgestimmt für</div>
      <div
        className="mt-6 brut-border-lg px-6 py-8 max-w-md"
        style={{ backgroundColor: color }}
      >
        <div className="font-display text-2xl md:text-3xl leading-tight">
          {picked}
        </div>
      </div>
      <div className="mt-6 stamp text-stone">Deine Prognose</div>
      <div className="mt-1 text-base text-ink/80 max-w-xs">{predictionLabel}</div>
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="mt-8 stamp text-stone"
      >
        Warte auf die anderen…
      </motion.div>
    </motion.div>
  );
}
