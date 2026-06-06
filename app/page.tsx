import Link from "next/link";
import SubmitDilemmaForm from "@/components/SubmitDilemmaForm";
import ScoringRules from "@/components/ScoringRules";

// =====================================================================
// Landing Page (Startseite)
// ---------------------------------------------------------------------
// Erste Seite, die jede:r sieht. Enthält:
//   1. Hero Sektion mit den beiden CTAs ("Spiel starten" und "Beitreten")
//   2. Beispiel Vorschau, damit man direkt sieht, wie es aussieht
//   3. Mini Anleitung in 3 Schritten + die Punkteregeln
//   4. Formular zum Einreichen eigener Fragen
//
// Das ist eine reine Server Component (kein "use client"). Der einzige
// interaktive Teil ist das Formular, das selbst "use client" deklariert.
// =====================================================================
export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Dekorative Seitenleiste links, nur ab lg sichtbar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-16 items-center justify-center border-r-2 border-ink bg-ink text-cream">
        <div className="vertical-marquee font-mono text-xs tracking-widest">
          WYE · V 0.1 · DHBW LÖRRACH WEB 2. SEM · LIVE · WYE
        </div>
      </aside>

      <div className="lg:pl-16 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 lg:px-12 py-5 border-b-2 border-ink">
          <div className="flex items-baseline gap-3">
            <span className="font-display italic text-2xl">würdest</span>
            <span className="stamp text-stone">du eher…?</span>
          </div>
          <span className="stamp text-stone hidden md:inline">
            live · abstimmung · dilemma
          </span>
        </header>

        {/* Hero */}
        <section className="flex-1 grid lg:grid-cols-[1.2fr_1fr] gap-0 border-b-2 border-ink">
          <div className="p-8 lg:p-16 flex flex-col justify-center relative">
            <div className="stamp text-stone mb-6">Nr. 001 · Dilemma</div>
            <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-[0.92] tracking-tight">
              Würdest<br />
              du <span className="italic">eher</span>…
              <span
                className="inline-block align-top -mr-1"
                style={{ color: "#FF5436" }}
              >
                ?
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg md:text-xl text-ink/80">
              Stell deiner Klasse ein unmögliches Dilemma. Alle stimmen live ab,
              und der Raum lernt sich auf die beste Art kennen: mit einem
              Countdown, animierten Balken und einer Bonusregel, bei der
              manchmal die <em>Minderheit</em> gewinnt.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/host"
                className="group bg-ink text-cream px-6 py-4 font-semibold text-lg brut-border-lg inline-flex items-center gap-3 transition-transform hover:-translate-y-0.5"
              >
                <span>Spiel starten</span>
                <span
                  aria-hidden
                  className="inline-block transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
              <Link
                href="/play"
                className="group bg-lime text-ink px-6 py-4 font-semibold text-lg brut-border-lg inline-flex items-center gap-3 transition-transform hover:-translate-y-0.5"
              >
                <span>Mit Code beitreten</span>
                <span aria-hidden>⤵</span>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-2 max-w-xl">
              <MiniStep n="01" text="Host zeigt QR + Code am Beamer" />
              <MiniStep n="02" text="Alle scannen und wählen Avatar" />
              <MiniStep n="03" text="Fragen · Countdown · Chart · Siegerehrung" />
            </div>

            <div className="mt-8 max-w-xl">
              <ScoringRules />
            </div>
          </div>

          {/* Dekoratives Preview rechts */}
          <div className="relative bg-ink text-cream p-8 lg:p-12 overflow-hidden">
            <div className="absolute -top-10 -right-10 text-[14rem] font-display italic opacity-15 leading-none select-none">
              vs
            </div>

            <div className="relative flex flex-col gap-6">
              <div className="stamp">Beispiel-Frage</div>
              <div className="font-display italic text-3xl md:text-5xl leading-tight">
                „Würdest du eher die Bahn zum DHBW Lörrach nehmen oder per
                Anhalter?"
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div
                  className="p-4 brut-border-lg text-ink flex flex-col justify-between h-44"
                  style={{ backgroundColor: "#CCFF4D" }}
                >
                  <div className="stamp">A</div>
                  <div className="text-2xl font-mono tabular font-bold">64%</div>
                </div>
                <div
                  className="p-4 brut-border-lg text-ink flex flex-col justify-between h-44"
                  style={{ backgroundColor: "#FF5436" }}
                >
                  <div className="stamp">B</div>
                  <div className="text-2xl font-mono tabular font-bold">36%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sektion: eigene Fragen einreichen (Community Pool) */}
        <section className="grid lg:grid-cols-[1fr_1.2fr] gap-0 border-b-2 border-ink">
          <div className="p-8 lg:p-16 flex flex-col justify-center bg-mist">
            <div className="stamp text-stone">Nr. 002 · Mitgestalten</div>
            <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] mt-3">
              Schlag uns<br />
              ein <em>Dilemma</em> vor.
            </h2>
            <p className="mt-6 text-lg text-ink/80 max-w-md">
              Du hast eine gute „Würdest du eher…?" Frage? Reich sie ein.
              Jeder Host sieht sie ab sofort im Manual Picker und kann sie in
              sein nächstes Spiel ziehen.
            </p>
            <div className="mt-6 stamp text-stone">
              Tipp: Gute Fragen sind knapp, konkret und schwer zu entscheiden.
            </div>
          </div>
          <div className="p-8 lg:p-14 flex items-center">
            <div className="w-full max-w-xl mx-auto">
              <SubmitDilemmaForm />
            </div>
          </div>
        </section>

        {/* Footer-Zeile */}
        <footer className="flex items-center justify-between px-6 lg:px-12 py-4 text-xs">
          <span className="stamp text-stone">
            Web-Entwicklung · Projekt · DHBW Lörrach
          </span>
          <span className="stamp text-stone">made with Next.js · Supabase</span>
        </footer>
      </div>
    </main>
  );
}

// Kleine Schritt Karte für die "So funktioniert's" 3er Reihe.
function MiniStep({ n, text }: { n: string; text: string }) {
  return (
    <div className="border-2 border-ink bg-cream p-3">
      <div className="font-mono text-xs text-stone">{n}</div>
      <div className="text-sm mt-1 leading-snug">{text}</div>
    </div>
  );
}
