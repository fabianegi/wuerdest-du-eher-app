import type { Choice, Prediction, ScoringMode, Vote } from "./supabase/types";
import { QUESTIONS } from "./questions";

// =====================================================================
// Spiellogik Helper
// ---------------------------------------------------------------------
// Alle Funktionen hier sind pure Functions: gleiche Eingabe ergibt
// gleiche Ausgabe, kein Zugriff auf DB oder Netzwerk. Das macht sie
// leicht im Kopf nachvollziehbar und gut testbar.
// =====================================================================

// Liste der Avatare beim Spielbeitritt. Reine Emoji, damit wir keinen
// externen Bilder Service brauchen und die App auch offline funktioniert.
export const AVATARS = [
  "🐸", "🐙", "🦊", "🐼", "🦁", "🐢",
  "🦄", "🐯", "🐵", "🦉", "🐨", "🐺",
  "🦕", "🦖", "🐲", "👾", "🤖", "👻",
  "🎃", "🌵", "🍄", "🧃", "☕️", "🍕",
];

// Alphabet für den Beitrittscode. Wir lassen 0/O und 1/I/L weg, damit
// niemand sich beim Abtippen vom Beamer vertippt.
// Beispielausgabe: "R7K29P"
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateGameCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

// Erzeugt ein zufälliges Host Secret. Wird beim Spielerstellen im
// localStorage abgelegt, damit der Host nach einem Page Reload immer
// noch sein eigenes Spiel weiterführen kann.
export function generateHostSecret(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback für sehr alte Browser ohne Web Crypto API.
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// Mischt ein Array zufällig (Fisher Yates Shuffle) und gibt eine neue
// Kopie zurück. Original bleibt unverändert.
export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Wählt n zufällige Frage IDs aus dem eingebauten Pool aus.
export function pickQuestionIds(n: number): number[] {
  return shuffle(QUESTIONS.map((q) => q.id)).slice(0, n);
}

// Würfelt pro Runde aus, ob die Mehrheit oder die Minderheit gewinnt.
// Mit ungefähr 30 % Minderheitsrunden bleibt das Spiel überraschend
// und vorhersagbares Voten lohnt sich nicht.
export function pickScoringModes(n: number): ScoringMode[] {
  return Array.from({ length: n }, () =>
    Math.random() < 0.3 ? "minority" : "majority",
  );
}

// Zählt, wie viele Spieler A bzw. B gewählt haben.
export function tallyVotes(votes: Vote[]): { a: number; b: number } {
  let a = 0, b = 0;
  for (const v of votes) {
    if (v.choice === "a") a++;
    else if (v.choice === "b") b++;
  }
  return { a, b };
}

// Ermittelt die Gewinnerseite einer Runde abhängig vom Scoring Modus.
// Bei exaktem Gleichstand gewinnt niemand (null).
export function winningChoice(
  tally: { a: number; b: number },
  mode: ScoringMode,
): Choice | null {
  if (tally.a === tally.b) return null;
  if (mode === "majority") return tally.a > tally.b ? "a" : "b";
  // Minderheits Modus: die kleinere Seite gewinnt.
  return tally.a < tally.b ? "a" : "b";
}

// =====================================================================
// Punktesystem (Prognose basiert, belohnt ehrliches Abstimmen)
// ---------------------------------------------------------------------
// Grundidee: Dein eigener Vote bringt dir keine extra Punkte. Deshalb
// lohnt es sich nicht, strategisch zu voten. Stattdessen gibt es Punkte
// aus zwei Quellen:
//
//   (1) Room Read: du tippst richtig, was die ANDEREN wählen.
//   (2) Courage Bonus: du erkennst, dass du in der Minderheit bist,
//       und stehst trotzdem zu deiner Meinung.
//
// Die Konstanten sind so gewählt, dass Courage am meisten zählt
// (mutige Selbsteinschätzung) und der Room Read mehr bringt, je
// klarer die Mehrheit war.
// =====================================================================

export const POINTS_PARTICIPATION    = 20;   // einfach für jedes Mitmachen
export const POINTS_ROOM_READ_CLEAR  = 100;  // klare Mehrheit (ab 65 %) richtig getippt
export const POINTS_ROOM_READ_TIGHT  = 60;   // knappe Mehrheit (55 bis 65 %) richtig getippt
export const POINTS_ROOM_READ_TIE    = 80;   // ungefähr 50/50 richtig erkannt
export const POINTS_COURAGE          = 150;  // Minderheit + gegen die eigene Prognose

// Was am Ende einer Runde pro Spieler:in herauskommt. "reasons" ist
// die Liste der Labels, die wir auf dem Handy anzeigen.
export interface ScoreBreakdown {
  participation: number;
  roomRead: number;
  courage: number;
  total: number;
  reasons: string[];
}

// Berechnet die Punkte eines Spielers für genau eine Runde.
//
// "otherVotes" enthält alle Stimmen DER ANDEREN, ohne die eigene.
// Wichtig: dadurch ist der Room Read entkoppelt vom eigenen Vote.
// Sonst könnte man durch Mitvoten die eigene Prognose künstlich
// "wahr" machen und sich Punkte sichern.
export function scoreRound(
  vote: Choice | null,
  prediction: Prediction | null,
  otherVotes: Vote[],
): ScoreBreakdown {
  const reasons: string[] = [];

  // Wer nicht abgestimmt hat, bekommt nichts.
  if (!vote) {
    return { participation: 0, roomRead: 0, courage: 0, total: 0, reasons: ["Kein Vote"] };
  }

  // Teilnahme Punkt: einfach fürs Mitmachen.
  const participation = POINTS_PARTICIPATION;
  reasons.push(`+${POINTS_PARTICIPATION} Teilnahme`);

  // Wie haben die anderen abgestimmt?
  const tally = tallyVotes(otherVotes);
  const total = tally.a + tally.b;
  const pctA = total > 0 ? tally.a / total : 0.5;

  // "Dominant" = wo liegt die Mehrheit der anderen?
  // 45 bis 55 % gilt als "ungefähr 50/50".
  const dominant: "a" | "b" | "tie" =
    pctA > 0.55 ? "a" : pctA < 0.45 ? "b" : "tie";

  // Room Read auswerten und passende Punkte vergeben.
  let roomRead = 0;
  if (prediction === "tie" && dominant === "tie") {
    roomRead = POINTS_ROOM_READ_TIE;
    reasons.push(`+${POINTS_ROOM_READ_TIE} Knappes Rennen erkannt`);
  } else if (
    (prediction === "a_wins" && dominant === "a") ||
    (prediction === "b_wins" && dominant === "b")
  ) {
    // Richtig getippt. Mehr Punkte, je klarer die Mehrheit war.
    const winnerPct = dominant === "a" ? pctA : 1 - pctA;
    if (winnerPct >= 0.65) {
      roomRead = POINTS_ROOM_READ_CLEAR;
      reasons.push(`+${POINTS_ROOM_READ_CLEAR} Klare Mehrheit erkannt`);
    } else {
      roomRead = POINTS_ROOM_READ_TIGHT;
      reasons.push(`+${POINTS_ROOM_READ_TIGHT} Knappe Mehrheit erkannt`);
    }
  } else if (prediction) {
    reasons.push("Room Read daneben");
  } else {
    reasons.push("Kein Room Read");
  }

  // Courage Bonus: Spieler:in hat getippt "die anderen wählen X",
  // ist selbst trotzdem auf der Gegenseite geblieben UND landet
  // wirklich in der Minderheit (höchstens 35 % Anteil).
  // Belohnt also Mut zur eigenen Meinung.
  let courage = 0;
  const allA = tally.a + (vote === "a" ? 1 : 0);
  const allB = tally.b + (vote === "b" ? 1 : 0);
  const allTotal = allA + allB;
  const myPct = allTotal === 0 ? 0.5 : (vote === "a" ? allA : allB) / allTotal;
  const inMinority = myPct <= 0.35;
  const predictedOthersPickOpposite =
    (prediction === "a_wins" && vote === "b") ||
    (prediction === "b_wins" && vote === "a");
  if (inMinority && predictedOthersPickOpposite) {
    courage = POINTS_COURAGE;
    reasons.push(`+${POINTS_COURAGE} Courage: gegen den Strom geblieben`);
  }

  return {
    participation,
    roomRead,
    courage,
    total: participation + roomRead + courage,
    reasons,
  };
}

// Wie viele Sekunden bleiben noch, bis die aktuelle Abstimmung endet?
// Wir rechnen relativ zum Server Timestamp "question_starts_at",
// damit alle Geräte denselben Countdown sehen, auch wenn die lokale
// Uhr leicht abweicht.
export function remainingSeconds(
  startsAt: string | null,
  durationSeconds: number,
): number {
  if (!startsAt) return durationSeconds;
  const end = new Date(startsAt).getTime() + durationSeconds * 1000;
  const ms = end - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}
