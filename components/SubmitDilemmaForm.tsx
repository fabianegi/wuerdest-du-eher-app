"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

// =====================================================================
// SubmitDilemmaForm
// ---------------------------------------------------------------------
// Formular, in dem jede:r eine eigene "Würdest du eher...?" Frage
// einreichen kann. Die Frage landet in der Tabelle
// submitted_questions und ist danach sofort für alle Hosts im
// Manual Picker sichtbar.
//
// Bewusst keine Moderation. Wir gehen davon aus, dass im Klassenraum
// Vertrauen herrscht. Für eine öffentliche Version würde man hier
// eine Approved Flag und einen Admin Workflow ergänzen.
// =====================================================================
export default function SubmitDilemmaForm() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [submitter, setSubmitter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Eingaben säubern und kurz validieren. Die Längen Checks sind
    // auch in der DB als CHECK Constraints hinterlegt (siehe schema.sql),
    // hier machen wir das nochmal client seitig für eine bessere UX.
    const cleanA = a.trim();
    const cleanB = b.trim();
    if (cleanA.length < 3 || cleanB.length < 3) {
      setError("Beide Optionen brauchen mindestens 3 Zeichen.");
      return;
    }
    if (cleanA.length > 200 || cleanB.length > 200) {
      setError("Maximal 200 Zeichen pro Option.");
      return;
    }

    setBusy(true);
    const { error: insertError } = await supabase.from("submitted_questions").insert({
      a: cleanA,
      b: cleanB,
      submitter_name: submitter.trim() || null,
    });
    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDone(true);
    setA("");
    setB("");
    setSubmitter("");
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="brut-border bg-lime p-6 text-ink"
      >
        <div className="stamp">Danke!</div>
        <div className="font-display text-2xl mt-2 leading-tight">
          Deine Frage liegt im Pool. Jeder Host kann sie jetzt auswählen.
        </div>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 bg-ink text-cream px-4 py-2 font-semibold brut-border text-sm"
        >
          Noch eine einreichen →
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 brut-border bg-cream p-6">
      <div>
        <div className="stamp text-stone">Deine Frage einreichen</div>
        <h3 className="font-display text-2xl md:text-3xl mt-1 leading-tight">
          Würdest du eher<span style={{ color: "#FF5436" }}>…</span>
        </h3>
        <p className="text-sm text-ink/70 mt-2">
          Wird direkt allen Hosts als Auswahl angeboten. Sei kreativ, bleib fair.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="stamp text-stone">Option A</span>
        <textarea
          value={a}
          onChange={(e) => {
            setError(null);
            setA(e.target.value);
          }}
          maxLength={200}
          rows={2}
          placeholder="Einen Monat nur Klausuren, keine Projekte"
          className="bg-mist border-2 border-ink p-3 text-base outline-none focus:bg-lime focus-visible:ring-2 focus-visible:ring-ink resize-none"
        />
      </label>

      <div className="stamp text-center text-stone -my-1">… oder eher</div>

      <label className="flex flex-col gap-1">
        <span className="stamp text-stone">Option B</span>
        <textarea
          value={b}
          onChange={(e) => {
            setError(null);
            setB(e.target.value);
          }}
          maxLength={200}
          rows={2}
          placeholder="Einen Monat nur Projekte, keine Klausuren"
          className="bg-mist border-2 border-ink p-3 text-base outline-none focus:bg-lime focus-visible:ring-2 focus-visible:ring-ink resize-none"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="stamp text-stone">Dein Name (optional)</span>
        <input
          value={submitter}
          onChange={(e) => setSubmitter(e.target.value)}
          maxLength={40}
          placeholder="Fabian"
          className="bg-mist border-2 border-ink py-2 px-3 text-base outline-none focus:bg-lime focus-visible:ring-2 focus-visible:ring-ink"
        />
      </label>

      {error && (
        <div className="text-coral font-semibold text-sm" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="bg-ink text-cream px-5 py-3 font-semibold brut-border disabled:opacity-40"
      >
        {busy ? "Wird eingereicht…" : "Einreichen →"}
      </button>
    </form>
  );
}
