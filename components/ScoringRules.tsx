// Kompakte Erklärung des Punktesystems für die Landing Page und die
// Lobby Ansicht. Ziel: Spieler:innen sollen in unter 10 Sekunden
// verstehen, warum ehrliches Abstimmen sich auszahlt.

interface Props {
  variant?: "default" | "compact";
}

export default function ScoringRules({ variant = "default" }: Props) {
  return (
    <div className="brut-border bg-cream p-4 md:p-5">
      <div className="stamp text-stone">So gibt's Punkte</div>

      <ol className="mt-3 flex flex-col gap-2 text-sm leading-snug">
        <RuleRow
          n="01"
          title="Ehrlich abstimmen"
          body="+20 Teilnahme. Deine Wahl selbst bringt keine extra Punkte, also lohnt sich Taktieren nicht."
        />
        <RuleRow
          n="02"
          title="Den Raum lesen"
          body="Tipp ab, was die anderen wählen. Richtig: +60 bis +100."
        />
        <RuleRow
          n="03"
          title="Courage-Bonus"
          body="+150 wenn du erkennst, dass du in der Minderheit bist, und trotzdem bei dir bleibst."
        />
      </ol>

      {variant === "default" && (
        <div className="stamp text-stone mt-4">
          Belohnt Ehrlichkeit und Raumkenntnis, nicht strategisches Voten.
        </div>
      )}
    </div>
  );
}

// Eine einzelne Regelzeile mit Nummer und Erklärung.
function RuleRow({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="font-mono text-stone shrink-0">{n}</span>
      <span>
        <strong>{title}.</strong> <span className="text-ink/80">{body}</span>
      </span>
    </li>
  );
}
