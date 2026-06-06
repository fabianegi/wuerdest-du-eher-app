"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// =====================================================================
// Code Eingabe für Spieler:innen
// ---------------------------------------------------------------------
// Jede:r ohne QR Code kommt hier rein, tippt den 6 stelligen Code
// vom Beamer ein und wird zur Spielseite /play/[code] weitergeleitet.
// =====================================================================
export default function PlayEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Wir tolerieren Kleinbuchstaben und Leerzeichen. Codes sind
    // immer großgeschrieben.
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 4) {
      setError("Der Code hat 6 Zeichen.");
      return;
    }
    router.push(`/play/${cleaned}`);
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 py-10 max-w-xl mx-auto">
      <nav aria-label="Seitennavigation">
        <Link href="/" className="stamp text-stone hover:text-ink">
          ← zurück
        </Link>
      </nav>

      <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[0.95]">
        Code<br />
        eintippen.
      </h1>

      <p className="mt-6 text-lg text-ink/80">
        Dein Host hat den Code am Beamer. Normalerweise 6 Zeichen, z.B.
        <span className="font-mono ml-1">R7K29P</span>.
      </p>

      <form onSubmit={submit} className="mt-10 flex flex-col gap-4">
        <input
          autoFocus
          value={code}
          onChange={(e) => {
            setError(null);
            setCode(e.target.value.toUpperCase());
          }}
          maxLength={8}
          placeholder="R7K29P"
          className="w-full bg-cream border-2 border-ink text-center font-mono tabular tracking-[0.4em] text-5xl md:text-6xl py-6 outline-none focus:bg-lime focus-visible:ring-4 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
        />

        {error && <div className="text-coral text-sm">{error}</div>}

        <button
          type="submit"
          className="bg-ink text-cream px-6 py-4 font-semibold text-lg brut-border-lg"
        >
          Beitreten →
        </button>
      </form>
    </main>
  );
}
