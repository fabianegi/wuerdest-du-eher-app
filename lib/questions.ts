// =====================================================================
// Eingebauter Fragenpool für "Würdest du eher...?"
// ---------------------------------------------------------------------
// Jede Frage hat eine eindeutige id, damit wir sie sauber speichern und
// referenzieren können. Neue Fragen einfach am Ende des Arrays
// einfügen, mit einer noch unbenutzten id.
//
// Solange mindestens 10 Einträge vorhanden sind, läuft alles out of
// the box. Neue Kategorien können einfach in den Union Type unten
// ergänzt werden.
// =====================================================================

export interface Question {
  id: number;
  category: "dhbw" | "studi-leben" | "tech" | "chaos";
  a: string;
  b: string;
  // Optional: kurzer Witz oder Hinweis, der bei der Auflösung
  // unter dem Diagramm angezeigt wird.
  flavor?: string;
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "dhbw",
    a: "Mit der Bahn von Freiburg zum DHBW Lörrach Campus",
    b: "Per Anhalter zum DHBW Lörrach Campus",
    flavor: "Spoiler: Beides kann länger dauern als erwartet.",
  },
  {
    id: 2,
    category: "studi-leben",
    a: "Eine 20-seitige Hausarbeit schreiben",
    b: "Vier Klausuren in einer Woche",
  },
  {
    id: 3,
    category: "dhbw",
    a: "Jeden Morgen um 6 Uhr Mathe II hören",
    b: "Bis Mitternacht an einer Python-Abgabe sitzen",
  },
  {
    id: 4,
    category: "dhbw",
    a: "In der Mensa Lörrach essen",
    b: "90 Minuten nach Basel fahren für Mittagessen",
  },
  {
    id: 5,
    category: "dhbw",
    a: "Theoriephase ohne Urlaubstage",
    b: "Praxisphase ohne Gehalt",
    flavor: "Beides ist gleichermaßen unrealistisch.",
  },
  {
    id: 6,
    category: "studi-leben",
    a: "Deinen Dozenten immer duzen dürfen",
    b: "Deinen Dozenten immer siezen müssen",
  },
  {
    id: 7,
    category: "tech",
    a: "Ein Jahr lang nur noch VS Code",
    b: "Ein Jahr lang nur noch Vim",
  },
  {
    id: 8,
    category: "chaos",
    a: "Deinen Laptop am Präsentationstag vergessen",
    b: "Die falsche Version der Präsentation öffnen",
  },
  {
    id: 9,
    category: "dhbw",
    a: "In Lörrach wohnen",
    b: "Täglich aus Freiburg oder Basel pendeln",
  },
  {
    id: 10,
    category: "tech",
    a: "Prüfung mit Taschenrechner, ohne Formelsammlung",
    b: "Prüfung mit Formelsammlung, ohne Taschenrechner",
  },
  {
    id: 11,
    category: "studi-leben",
    a: "Nie wieder Kaffee im Studium",
    b: "Nie wieder WLAN zu Hause",
  },
  {
    id: 12,
    category: "chaos",
    a: "Vor der gesamten Klasse einen Witz erzählen",
    b: "Den Dozenten zum Mittagessen einladen müssen",
  },
  {
    id: 13,
    category: "tech",
    a: "Ein Projekt ohne Git versionieren",
    b: "Ein Projekt ohne Tests releasen",
    flavor: "Beides verfolgt dich noch im Schlaf.",
  },
  {
    id: 14,
    category: "studi-leben",
    a: "Jede Vorlesung auf Englisch",
    b: "Jede Vorlesung im Pflicht-Latein",
  },
  {
    id: 15,
    category: "dhbw",
    a: "Moodle nie wieder nutzen",
    b: "Das gesamte Skript ausgedruckt bekommen",
  },
  {
    id: 16,
    category: "chaos",
    a: "Einen Bug im Production-Code pushen",
    b: "Einen Kommentar aus Versehen an alle schicken",
  },
  {
    id: 17,
    category: "tech",
    a: "Ein Semester nur JavaScript",
    b: "Ein Semester nur Rust",
  },
  {
    id: 18,
    category: "studi-leben",
    a: "Mit Kommilitonen in einer WG wohnen",
    b: "Alleine wohnen, aber 40 Minuten pendeln",
  },
];

// Sucht eine Frage anhand ihrer id heraus. Gibt undefined zurück, wenn
// es die id nicht (mehr) gibt, z. B. weil ein altes Spiel auf eine
// inzwischen gelöschte Frage zeigt.
export function getQuestionById(id: number): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

// Einheitliches Format für den Manual Picker auf der Host Seite.
// Egal ob die Frage aus dem eingebauten Pool oder von einer Spieler:in
// kommt, sie kommt hier in derselben Struktur an.
export interface PickableQuestion {
  id: number;
  a: string;
  b: string;
  flavor?: string | null;
  source: "builtin" | "community";
  submitter_name?: string | null;
}

// Konvertiert die eingebauten Fragen ins PickableQuestion Format,
// damit sie im Picker zusammen mit Community Fragen angezeigt
// werden können.
export function builtinAsPickable(): PickableQuestion[] {
  return QUESTIONS.map((q) => ({
    id: q.id,
    a: q.a,
    b: q.b,
    flavor: q.flavor ?? null,
    source: "builtin",
  }));
}
