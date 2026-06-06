"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import { supabase } from "@/lib/supabase/client";
import {
  generateGameCode,
  generateHostSecret,
  pickQuestionIds,
  pickScoringModes,
  shuffle,
} from "@/lib/game-helpers";
import {
  QUESTIONS,
  builtinAsPickable,
  type PickableQuestion,
} from "@/lib/questions";
import type { GameQuestionSnapshot, SubmittedQuestion } from "@/lib/supabase/types";

// Wie der Host die Fragen für sein Spiel auswählt:
//   "random" = wir würfeln n Fragen aus dem eingebauten Pool
//   "manual" = der Host klickt sich seine Wunschfragen zusammen
type PickMode = "random" | "manual";

// =====================================================================
// Host: Neues Spiel erstellen
// ---------------------------------------------------------------------
// Auf dieser Seite stellt der Host die Runde ein (Anzahl Fragen,
// Sekunden pro Frage, Pick Modus) und legt das Game in der Datenbank
// an. Bei Erfolg leiten wir auf die Beamer Ansicht /host/[gameId] um.
// =====================================================================
export default function HostCreatePage() {
  const router = useRouter();

  // ---- Form State ---------------------------------------------------
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [duration, setDuration] = useState(20);
  const [mode, setMode] = useState<PickMode>("random");

  // Der Fragenpool für den Manual Picker. Wir laden ihn LAZY, also
  // erst wenn der Host wirklich auf "Selbst auswählen" klickt. Sonst
  // würden wir bei jedem Seitenaufruf unnötig die Community Fragen
  // ziehen.
  const [pool, setPool] = useState<PickableQuestion[] | null>(null);
  const [loadingPool, setLoadingPool] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ---- UI State -----------------------------------------------------
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Beim ersten Wechsel auf "manual" laden wir den Fragenpool aus
  // Supabase und mischen ihn mit den eingebauten Fragen.
  // Community Fragen kommen oben (frischeste zuerst), damit neue
  // Einreichungen schneller gesehen werden.
  useEffect(() => {
    if (mode !== "manual" || pool !== null || loadingPool) return;
    setLoadingPool(true);
    (async () => {
      const { data } = await supabase
        .from("submitted_questions")
        .select("*")
        .eq("approved", true)
        .order("submitted_at", { ascending: false });
      const community: PickableQuestion[] = ((data ?? []) as SubmittedQuestion[]).map(
        (s) => ({
          id: s.id,
          a: s.a,
          b: s.b,
          flavor: s.flavor,
          source: "community",
          submitter_name: s.submitter_name,
        }),
      );
      setPool([...community, ...builtinAsPickable()]);
      setLoadingPool(false);
    })();
  }, [mode, pool, loadingPool]);

  // Im Manual Modus brauchen wir mindestens 3 Fragen, sonst lohnt
  // sich das Spiel nicht. Im Random Modus ist der Button immer aktiv.
  const manualCount = selectedIds.size;
  const manualReady = mode !== "manual" || manualCount >= 3;

  // Legt ein neues Spiel in der DB an und springt direkt auf die
  // Beamer Ansicht. Wir kopieren die Fragen als Snapshot mit ins
  // Spiel, damit das Spiel auch dann weiterläuft, wenn jemand
  // gleichzeitig eine Community Frage löscht.
  async function createGame() {
    setCreating(true);
    setError(null);

    // Snapshot und Reihenfolge je nach Modus aufbauen.
    let snapshot: GameQuestionSnapshot[];
    let order: number[];
    if (mode === "random") {
      const picked = pickQuestionIds(totalQuestions);
      snapshot = picked.map((id) => {
        const q = QUESTIONS.find((x) => x.id === id)!;
        return {
          id: q.id,
          a: q.a,
          b: q.b,
          flavor: q.flavor ?? null,
          source: "builtin",
        };
      });
      order = picked;
    } else {
      const picked = shuffle(Array.from(selectedIds));
      snapshot = picked.map((id) => {
        const q = pool!.find((p) => p.id === id)!;
        return {
          id: q.id,
          a: q.a,
          b: q.b,
          flavor: q.flavor ?? null,
          source: q.source,
        };
      });
      order = picked;
    }
    const count = snapshot.length;
    const scoringModes = pickScoringModes(count);

    // Code Kollisionen sind extrem unwahrscheinlich, aber theoretisch
    // möglich (Codes haben nur 6 Stellen). Wenn die DB einen
    // unique_violation (23505) zurückgibt, einfach neuen Code würfeln
    // und es noch ein paar Mal probieren.
    for (let attempt = 0; attempt < 4; attempt++) {
      const code = generateGameCode(6);
      const hostSecret = generateHostSecret();

      const { data, error: insertError } = await supabase
        .from("games")
        .insert({
          code,
          host_secret: hostSecret,
          phase: "lobby",
          current_question_index: 0,
          total_questions: count,
          question_order: order,
          questions_snapshot: snapshot,
          scoring_modes: scoringModes,
          question_duration_seconds: duration,
        })
        .select()
        .single();

      if (!insertError && data) {
        // Host Secret im Browser speichern. Damit erkennen wir den Host
        // bei einem Reload wieder. localStorage kann in Privacy Modi
        // ausnahmsweise blockiert sein, deshalb der Try Catch.
        try {
          localStorage.setItem(`wye_host_secret_${data.id}`, hostSecret);
        } catch {
          /* nichts tun, ist nicht kritisch */
        }
        router.push(`/host/${data.id}`);
        return;
      }

      if (insertError && insertError.code !== "23505") {
        setError(insertError.message);
        setCreating(false);
        return;
      }
    }

    setError("Konnte keinen eindeutigen Code finden. Bitte nochmal versuchen.");
    setCreating(false);
  }

  return (
    <main className="min-h-screen px-6 py-10 lg:p-16 max-w-4xl mx-auto">
      <nav aria-label="Seitennavigation">
        <Link href="/" className="stamp text-stone hover:text-ink">
          ← zurück
        </Link>
      </nav>

      <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[0.95]">
        Neues <em>Dilemma</em>
        <br />
        vorbereiten
      </h1>

      <p className="mt-6 text-lg text-ink/80 max-w-2xl">
        Stell die Runde ein, klick auf <em>Spiel erstellen</em>, und projizier
        die folgende Seite an den Beamer. Deine Kommilitonen scannen den QR.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-2xl">
        {mode === "random" && (
          <NumberField
            label="Anzahl Fragen"
            value={totalQuestions}
            min={3}
            max={15}
            onChange={setTotalQuestions}
            helper="Wie viele 'Würdest du eher…?' pro Spiel."
          />
        )}
        <NumberField
          label="Sekunden pro Frage"
          value={duration}
          min={10}
          max={60}
          step={5}
          onChange={setDuration}
          helper="Wie lang die Leute Zeit zum Abstimmen haben."
        />
      </div>

      {/* Mode-Toggle */}
      <div className="mt-10">
        <div className="stamp text-stone mb-2">Fragen-Auswahl</div>
        <div className="grid grid-cols-2 brut-border max-w-2xl">
          <ModeButton
            active={mode === "random"}
            onClick={() => setMode("random")}
            title="Zufall"
            subtitle={`${totalQuestions} Fragen zufällig aus dem Pool`}
          />
          <ModeButton
            active={mode === "manual"}
            onClick={() => setMode("manual")}
            title="Selbst auswählen"
            subtitle="Builtin + Community-Einreichungen"
          />
        </div>
      </div>

      {mode === "manual" && (
        <ManualPicker
          pool={pool}
          loading={loadingPool}
          selectedIds={selectedIds}
          onToggle={(id) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
        />
      )}

      <div className="mt-10 flex flex-wrap gap-4 items-center">
        <button
          type="button"
          onClick={createGame}
          disabled={creating || !manualReady}
          className="bg-ink text-cream px-6 py-4 font-semibold text-lg brut-border-lg disabled:opacity-40"
        >
          {creating
            ? "Erstelle Spiel…"
            : mode === "manual"
              ? `Spiel erstellen (${manualCount} Fragen) →`
              : "Spiel erstellen →"}
        </button>

        {mode === "manual" && !manualReady && (
          <div className="stamp text-stone">
            Mindestens 3 Fragen auswählen ({manualCount}/3)
          </div>
        )}

        {error && (
          <div className="text-coral font-semibold" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="mt-16 border-t-2 border-ink pt-6 text-sm text-stone max-w-2xl">
        Tipp: Der Link zum Join kann später auch direkt geteilt werden, falls
        jemand kein Handy dabeihat. Der QR-Code führt auf <code>/play/CODE</code>.
      </div>
    </main>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "p-4 text-left transition-colors",
        active ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-mist",
      )}
    >
      <span className="font-display text-xl block">{title}</span>
      <span
        className={clsx(
          "text-xs mt-1 block",
          active ? "text-cream/70" : "text-stone",
        )}
      >
        {subtitle}
      </span>
    </button>
  );
}

function ManualPicker({
  pool,
  loading,
  selectedIds,
  onToggle,
}: {
  pool: PickableQuestion[] | null;
  loading: boolean;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  const communityCount = useMemo(
    () => pool?.filter((q) => q.source === "community").length ?? 0,
    [pool],
  );

  if (loading || !pool) {
    return (
      <div className="mt-6 stamp text-stone">Lade Fragen…</div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="stamp text-stone">
          {pool.length} Fragen im Pool · {communityCount} von Community
        </div>
      </div>
      <ul className="brut-border bg-cream divide-y-2 divide-ink max-h-[420px] overflow-y-auto">
        {pool.map((q) => {
          const checked = selectedIds.has(q.id);
          return (
            <li key={`${q.source}-${q.id}`}>
              <label
                className={clsx(
                  "flex items-start gap-3 p-4 cursor-pointer transition-colors",
                  checked ? "bg-lime" : "hover:bg-mist",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(q.id)}
                  className="mt-1 h-5 w-5 accent-black"
                />
                <span className="flex-1 min-w-0 block">
                  <span className="text-sm md:text-base leading-snug block">
                    <strong>{q.a}</strong>{" "}
                    <span className="text-ink/50">oder</span>{" "}
                    <strong>{q.b}</strong>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-2 stamp text-stone">
                    <span>
                      {q.source === "community" ? "Community" : "Builtin"}
                    </span>
                    {q.submitter_name && <span>· von {q.submitter_name}</span>}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  helper,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  helper?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-col gap-2 brut-border bg-cream p-4"
    >
      <span className="stamp">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="bg-mist hover:bg-ink hover:text-cream border-2 border-ink w-10 h-10 font-mono text-xl"
          aria-label={`${label}: weniger`}
        >
          -
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          aria-label={label}
          onChange={(e) =>
            onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))
          }
          className="flex-1 bg-transparent border-none text-4xl font-mono tabular font-bold text-center outline-none focus-visible:ring-2 focus-visible:ring-ink"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="bg-mist hover:bg-ink hover:text-cream border-2 border-ink w-10 h-10 font-mono text-xl"
          aria-label={`${label}: mehr`}
        >
          +
        </button>
      </div>
      {helper && <span className="text-xs text-stone">{helper}</span>}
    </div>
  );
}
