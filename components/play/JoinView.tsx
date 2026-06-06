"use client";

import { useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase/client";
import { AVATARS } from "@/lib/game-helpers";
import type { Game } from "@/lib/supabase/types";
import AvatarPicker from "@/components/AvatarPicker";

// Identität, die wir im localStorage ablegen. So bekommt ein Reload
// nicht plötzlich einen zweiten Datensatz für dieselbe Person.
export type PlayerIdentity = { id: string; nickname: string; avatar: string };

interface Props {
  game: Game;
  takenNicknames: string[];
  onJoined: (p: PlayerIdentity) => void;
}

// =====================================================================
// Join Screen
// ---------------------------------------------------------------------
// Hier wählt jede:r Nickname und Avatar und legt damit die eigene
// Spieler:innen Zeile in der DB an. Nach erfolgreichem Insert ruft
// onJoined die Elternkomponente, die wiederum den State und den
// localStorage Eintrag setzt.
// =====================================================================
export default function JoinView({ game, takenNicknames, onJoined }: Props) {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(
    AVATARS[Math.floor(Math.random() * AVATARS.length)],
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Wir lassen Späteinsteiger:innen jederzeit zu, außer das Spiel ist
  // schon im Finale. Wer mitten im Spiel joint, verpasst zwar die
  // bisherigen Runden, kann aber ab jetzt noch Punkte sammeln.
  const canJoin = game.phase !== "final";

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!canJoin) return;
    const clean = nickname.trim();
    if (clean.length < 2) return setErr("Nickname muss mindestens 2 Zeichen haben.");
    if (clean.length > 16) return setErr("Maximal 16 Zeichen.");
    if (takenNicknames.includes(clean.toLowerCase()))
      return setErr("Den Namen hat schon jemand.");

    setBusy(true);

    // Zusätzlicher Server Check, ob der Name in einer anderen Schreibweise
    // schon vergeben ist. Die Unique Constraint in der DB ist case
    // sensitiv ("Max" und "max" wären zwei Einträge), der Client Check
    // arbeitet aber lowercased. Damit das konsistent bleibt, fragen wir
    // vor dem Insert nochmal mit ilike (case insensitive) an.
    // Das ist kein 100 prozentiger Schutz vor Race Conditions, aber für
    // Klassenraum Traffic absolut ausreichend.
    const { data: existing } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", game.id)
      .ilike("nickname", clean)
      .maybeSingle();
    if (existing) {
      setBusy(false);
      return setErr("Den Namen hat schon jemand.");
    }

    const { data, error } = await supabase
      .from("players")
      .insert({ game_id: game.id, nickname: clean, avatar })
      .select()
      .single();
    setBusy(false);
    if (error) {
      if (error.code === "23505") {
        return setErr("Den Namen hat schon jemand. Nimm einen anderen.");
      }
      return setErr(error.message);
    }
    if (!data) return setErr("Hat nicht geklappt, nochmal probieren.");
    onJoined({ id: data.id, nickname: data.nickname, avatar: data.avatar });
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-8 max-w-xl mx-auto w-full">
      <Link href="/play" className="stamp text-stone hover:text-ink">
        ← Code ändern
      </Link>

      <div className="mt-6">
        <div className="stamp text-stone">Code</div>
        <div className="font-mono tabular tracking-[0.25em] text-3xl md:text-4xl font-bold">
          {game.code}
        </div>
      </div>

      {!canJoin && (
        <div className="mt-8 bg-coral text-ink p-4 brut-border">
          Das Spiel ist schon vorbei. Bitte den Host, eine neue Runde zu
          starten.
        </div>
      )}
      {canJoin && game.phase !== "lobby" && (
        <div className="mt-8 bg-mist text-ink p-4 brut-border text-sm">
          Das Spiel läuft bereits. Du steigst in der aktuellen Runde ein und
          sammelst ab jetzt Punkte.
        </div>
      )}

      <form onSubmit={join} className="mt-10 flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="stamp">Nickname</span>
          <input
            autoFocus
            value={nickname}
            onChange={(e) => {
              setErr(null);
              setNickname(e.target.value);
            }}
            maxLength={16}
            placeholder="Fabi"
            disabled={!canJoin}
            className="bg-cream border-2 border-ink text-2xl font-semibold py-3 px-4 outline-none focus:bg-lime focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-50"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="stamp">Avatar</span>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>

        {err && <div className="text-coral text-sm">{err}</div>}

        <button
          type="submit"
          disabled={busy || !canJoin}
          className="bg-ink text-cream px-6 py-4 font-semibold text-lg brut-border-lg disabled:opacity-40"
        >
          {busy ? "Trete bei…" : "Los geht's →"}
        </button>
      </form>
    </main>
  );
}
