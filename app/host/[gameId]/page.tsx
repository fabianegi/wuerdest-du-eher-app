"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";

import { supabase } from "@/lib/supabase/client";
import type { Game, GameQuestionSnapshot, Player, Vote } from "@/lib/supabase/types";
import { getQuestionById, type Question } from "@/lib/questions";
import { scoreRound, tallyVotes } from "@/lib/game-helpers";

import HostLobbyView from "@/components/host/HostLobbyView";
import HostQuestionView from "@/components/host/HostQuestionView";
import HostRevealView from "@/components/host/HostRevealView";
import HostFinalView from "@/components/host/HostFinalView";

// =====================================================================
// Beamer Ansicht (Host)
// ---------------------------------------------------------------------
// Zentrale Steuerseite des Hosts während eines Spiels.
//
// Aufgaben:
//   1. Spiel über die gameId aus der URL laden.
//   2. Spieler und Stimmen via Supabase Realtime live mitführen.
//   3. Drei Host Aktionen anbieten:
//        startGame             (Lobby zur ersten Frage)
//        revealCurrentQuestion (Frage Phase zur Auflösung)
//        nextOrFinish          (Auflösung zur nächsten Frage oder ins Finale)
//   4. Je nach game.phase die passende Sub View aus components/host/*
//      rendern.
// =====================================================================
export default function HostGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState(false);

  // ---- Initialer Load ---------------------------------------------------
  // Holt einmalig Spiel, Spieler und bisherige Stimmen aus der DB.
  // "mounted" verhindert State Updates, falls die Komponente vor
  // Antwort der DB unmountet wird.
  useEffect(() => {
    setOrigin(window.location.origin);
    let mounted = true;

    (async () => {
      const { data: g } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .maybeSingle();
      if (!mounted) return;
      if (!g) {
        router.push("/host");
        return;
      }
      setGame(g as Game);

      const { data: ps } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId)
        .order("joined_at", { ascending: true });
      if (mounted) setPlayers((ps as Player[]) ?? []);

      const { data: vs } = await supabase
        .from("votes")
        .select("*")
        .eq("game_id", gameId);
      if (mounted) setVotes((vs as Vote[]) ?? []);
    })();

    return () => {
      mounted = false;
    };
  }, [gameId, router]);

  // ---- Realtime Subscriptions ------------------------------------------
  // Hört auf alle Änderungen am Spiel, an Spielern und an Stimmen.
  // Beim Unmount räumen wir den Channel sauber wieder ab.
  useEffect(() => {
    if (!gameId) return;
    const channel = supabase
      .channel(`host-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => setGame(payload.new as Game),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Player;
            setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as Player;
            setPlayers((prev) => prev.filter((p) => p.id !== old.id));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `game_id=eq.${gameId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setVotes((prev) => [...prev, payload.new as Vote]);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  // ---- Abgeleitete Werte: aktuelle Frage und Stimmen --------------------
  // Wir bevorzugen den Snapshot, der beim Spielstart eingefroren wurde
  // (self contained). Falls dieser fehlt (alte Spiele aus der ersten
  // MVP Version), greifen wir auf die builtin Fragen via
  // question_order zurück.
  const currentQuestion: Question | GameQuestionSnapshot | undefined = (() => {
    if (!game) return undefined;
    const snap = game.questions_snapshot?.[game.current_question_index];
    if (snap) return snap;
    const legacyId = game.question_order?.[game.current_question_index];
    return legacyId ? getQuestionById(legacyId) : undefined;
  })();
  const currentVotes = useMemo(
    () =>
      game
        ? votes.filter((v) => v.question_index === game.current_question_index)
        : [],
    [votes, game],
  );
  const currentMode = game?.scoring_modes?.[game.current_question_index] ?? "majority";
  const currentTally = tallyVotes(currentVotes);

  // ---- Host Aktionen ---------------------------------------------------

  // Aus der Lobby in die erste Frage springen.
  async function startGame() {
    if (!game || busy) return;
    setBusy(true);
    await supabase
      .from("games")
      .update({
        phase: "question",
        current_question_index: 0,
        question_starts_at: new Date().toISOString(),
      })
      .eq("id", game.id);
    setBusy(false);
  }

  // Frage auflösen und Punkte verteilen.
  //
  // Wichtig: Das Phase Update auf "reveal" ist gleichzeitig unser
  // atomarer Lock. Nur der erste Aufruf, bei dem die Zeile noch im
  // Status "question" ist, bekommt die Zeile auch zurück. Alle
  // weiteren Aufrufe (z. B. wenn der Timer und ein manueller Klick
  // gleichzeitig zuschlagen) laufen ins Leere und vergeben damit
  // keine doppelten Punkte.
  async function revealCurrentQuestion() {
    if (!game || busy) return;
    setBusy(true);

    const { data: locked } = await supabase
      .from("games")
      .update({ phase: "reveal" })
      .eq("id", game.id)
      .eq("phase", "question")
      .select()
      .maybeSingle();

    if (!locked) {
      // Ein anderer Tab oder der Countdown war schneller. Scoring
      // überspringen, sonst würden Punkte doppelt vergeben.
      setBusy(false);
      return;
    }

    // Pro Spieler:in die Punkte für diese Runde berechnen.
    const updates: Array<{ id: string; newScore: number }> = [];
    for (const player of players) {
      const myVote = currentVotes.find((v) => v.player_id === player.id) ?? null;
      const others = currentVotes.filter((v) => v.player_id !== player.id);
      const breakdown = scoreRound(
        myVote?.choice ?? null,
        myVote?.prediction ?? null,
        others,
      );
      if (breakdown.total > 0) {
        updates.push({ id: player.id, newScore: player.score + breakdown.total });
      }
    }

    if (updates.length > 0) {
      await Promise.all(
        updates.map((u) =>
          supabase.from("players").update({ score: u.newScore }).eq("id", u.id),
        ),
      );
    }

    setBusy(false);
  }

  // Nach der Auflösung weiter zur nächsten Frage oder, falls keine
  // mehr da sind, ins Finale wechseln.
  async function nextOrFinish() {
    if (!game || busy) return;
    setBusy(true);
    const hasMore = game.current_question_index + 1 < game.total_questions;
    if (hasMore) {
      await supabase
        .from("games")
        .update({
          phase: "question",
          current_question_index: game.current_question_index + 1,
          question_starts_at: new Date().toISOString(),
        })
        .eq("id", game.id);
    } else {
      await supabase.from("games").update({ phase: "final" }).eq("id", game.id);
    }
    setBusy(false);
  }

  // ---- Render ----------------------------------------------------------
  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="stamp text-stone">Spiel wird geladen…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top Bar mit Code und Fortschritts Anzeige */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 md:px-10 py-4 border-b-2 border-ink">
        <Link href="/" className="stamp text-stone hover:text-ink">
          ← Startseite
        </Link>
        <div className="flex items-center gap-6">
          <div className="stamp text-stone">
            Frage{" "}
            <span className="font-mono text-ink">
              {Math.min(game.current_question_index + 1, game.total_questions)}
            </span>{" "}
            / {game.total_questions}
          </div>
          <div className="flex items-center gap-3">
            <span className="stamp text-stone">Code</span>
            <span className="font-mono tabular font-bold text-2xl md:text-3xl tracking-widest">
              {game.code}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {game.phase === "lobby" && (
            <HostLobbyView
              key="lobby"
              code={game.code}
              origin={origin}
              players={players}
              onStart={startGame}
              busy={busy}
            />
          )}
          {game.phase === "question" && currentQuestion && (
            <HostQuestionView
              key={`q-${game.current_question_index}`}
              question={currentQuestion}
              tally={currentTally}
              totalPlayers={players.length}
              startsAt={game.question_starts_at}
              duration={game.question_duration_seconds}
              onReveal={revealCurrentQuestion}
              onTimeUp={revealCurrentQuestion}
              busy={busy}
            />
          )}
          {game.phase === "reveal" && currentQuestion && (
            <HostRevealView
              key={`r-${game.current_question_index}`}
              question={currentQuestion}
              tally={currentTally}
              mode={currentMode}
              isLast={game.current_question_index + 1 >= game.total_questions}
              onNext={nextOrFinish}
              busy={busy}
            />
          )}
          {game.phase === "final" && (
            <HostFinalView
              key="final"
              players={players}
              onNewGame={() => router.push("/host")}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
