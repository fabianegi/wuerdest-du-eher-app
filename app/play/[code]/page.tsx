"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";

import { supabase } from "@/lib/supabase/client";
import type {
  Game,
  GameQuestionSnapshot,
  Player,
  Vote,
} from "@/lib/supabase/types";
import { getQuestionById, type Question } from "@/lib/questions";

import JoinView, { type PlayerIdentity } from "@/components/play/JoinView";
import PlayerLobbyView from "@/components/play/PlayerLobbyView";
import PlayerVoteView from "@/components/play/PlayerVoteView";
import PlayerRevealView from "@/components/play/PlayerRevealView";
import PlayerFinalView from "@/components/play/PlayerFinalView";

// =====================================================================
// Spielersicht (Handy)
// ---------------------------------------------------------------------
// Was passiert hier:
//   1. Spiel über den 6 stelligen Code aus der URL laden.
//   2. Identität (Spieler ID + Nickname + Avatar) aus localStorage
//      wiederherstellen, damit ein Reload nicht zwei Spieler erzeugt.
//   3. Realtime Subscription: live mitbekommen, wenn der Host
//      die Phase wechselt oder neue Spieler joinen.
//   4. Je nach game.phase die passende Sub View rendern (Lobby,
//      Voting, Reveal, Finale).
// =====================================================================
export default function PlayGamePage() {
  const { code } = useParams<{ code: string }>();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [me, setMe] = useState<PlayerIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ---- Initialer Load --------------------------------------------------
  useEffect(() => {
    if (!code) return;
    let mounted = true;

    (async () => {
      const { data: g } = await supabase
        .from("games")
        .select("*")
        .eq("code", code.toUpperCase())
        .maybeSingle();
      if (!mounted) return;
      if (!g) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setGame(g as Game);

      // Falls die Spieler:in schon mal beigetreten ist, holen wir die
      // gespeicherte Identität aus dem localStorage. Wir prüfen, ob
      // die Spieler ID in der DB noch existiert (z. B. könnte der
      // Host sie gelöscht haben oder das Spiel wurde neu aufgesetzt).
      const raw = localStorage.getItem(`wye_player_${g.id}`);
      if (raw) {
        try {
          const stored = JSON.parse(raw) as PlayerIdentity;
          const { data: exists } = await supabase
            .from("players")
            .select("id,nickname,avatar")
            .eq("id", stored.id)
            .maybeSingle();
          if (exists) setMe(stored);
          else localStorage.removeItem(`wye_player_${g.id}`);
        } catch {
          localStorage.removeItem(`wye_player_${g.id}`);
        }
      }

      // Spielerliste und alle bisherigen Stimmen parallel laden.
      const [{ data: ps }, { data: vs }] = await Promise.all([
        supabase.from("players").select("*").eq("game_id", g.id).order("joined_at"),
        supabase.from("votes").select("*").eq("game_id", g.id),
      ]);
      if (!mounted) return;
      setPlayers((ps as Player[]) ?? []);
      setVotes((vs as Vote[]) ?? []);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [code]);

  // ---- Realtime Subscription -------------------------------------------
  useEffect(() => {
    if (!game) return;
    const channel = supabase
      .channel(`play-${game.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${game.id}` },
        (payload) => setGame(payload.new as Game),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `game_id=eq.${game.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === "UPDATE") {
            const p = payload.new as Player;
            setPlayers((prev) => prev.map((x) => (x.id === p.id ? p : x)));
          } else if (payload.eventType === "DELETE") {
            const p = payload.old as Player;
            setPlayers((prev) => prev.filter((x) => x.id !== p.id));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `game_id=eq.${game.id}` },
        (payload) => {
          setVotes((prev) => [...prev, payload.new as Vote]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id]);

  // ---- Abgeleitete Werte -----------------------------------------------
  const myPlayer = players.find((p) => p.id === me?.id) ?? null;
  // Aktuelle Frage: zuerst aus dem Snapshot, sonst Fallback auf
  // den eingebauten Pool (für ältere Spiele).
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
  const myVote = useMemo(
    () => (me ? currentVotes.find((v) => v.player_id === me.id) ?? null : null),
    [currentVotes, me],
  );

  // ---- Render Switch: zeigt je nach Phase die passende Sub View --------
  if (loading) {
    return <Centered>Laden…</Centered>;
  }

  if (notFound || !game) {
    return (
      <Centered>
        <div className="max-w-md text-center">
          <div className="stamp text-stone">Code nicht gefunden</div>
          <h1 className="font-display text-4xl md:text-6xl mt-3 leading-tight">
            Kein Spiel mit<br />
            Code <span className="font-mono">{code}</span>.
          </h1>
          <Link
            href="/play"
            className="inline-block mt-8 bg-ink text-cream px-5 py-3 font-semibold brut-border"
          >
            Anderen Code probieren →
          </Link>
        </div>
      </Centered>
    );
  }

  if (!me) {
    return (
      <JoinView
        game={game}
        takenNicknames={players.map((p) => p.nickname.toLowerCase())}
        onJoined={(identity) => {
          localStorage.setItem(`wye_player_${game.id}`, JSON.stringify(identity));
          setMe(identity);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b-2 border-ink">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{me.avatar}</span>
          <span className="font-semibold">{me.nickname}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="stamp text-stone hidden md:inline">
            Frage {Math.min(game.current_question_index + 1, game.total_questions)}/{game.total_questions}
          </span>
          <span className="font-mono tabular font-bold">{myPlayer?.score ?? 0}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {game.phase === "lobby" && (
            <PlayerLobbyView key="lobby" players={players} code={game.code} />
          )}
          {game.phase === "question" && currentQuestion && (
            <PlayerVoteView
              key={`q-${game.current_question_index}`}
              question={currentQuestion}
              myVote={myVote}
              startsAt={game.question_starts_at}
              duration={game.question_duration_seconds}
              onVote={async (choice, prediction) => {
                // Bei Fehler werfen wir bewusst eine Exception. PlayerVoteView
                // fängt sie ab, setzt sich selbst zurück und bietet der
                // Spieler:in einen Retry an.
                const { error } = await supabase.from("votes").insert({
                  game_id: game.id,
                  player_id: me.id,
                  question_index: game.current_question_index,
                  choice,
                  prediction,
                });
                if (error) throw new Error(error.message);
              }}
            />
          )}
          {game.phase === "reveal" && currentQuestion && (
            <PlayerRevealView
              key={`r-${game.current_question_index}`}
              question={currentQuestion}
              myVote={myVote}
              allVotes={currentVotes}
            />
          )}
          {game.phase === "final" && myPlayer && (
            <PlayerFinalView key="final" me={myPlayer} allPlayers={players} />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// Mini Helper: zeigt einen einzelnen, mittig zentrierten Text.
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="stamp text-stone">{children}</div>
    </main>
  );
}
