// =====================================================================
// TypeScript Typen für die Supabase Tabellen.
// Müssen mit dem SQL Schema (supabase/schema.sql) übereinstimmen.
// Wenn dort eine Spalte hinzukommt, hier ergänzen.
// =====================================================================

// Die vier Phasen, die ein Spiel durchläuft.
export type GamePhase = "lobby" | "question" | "reveal" | "final";

// Spieler wählen entweder Option A oder Option B.
export type Choice = "a" | "b";

// Pro Runde wird zufällig entschieden, ob die Mehrheit oder die
// Minderheit Punkte bekommt (siehe game-helpers.ts).
export type ScoringMode = "majority" | "minority";

// "Room Read": Der Spieler tippt, wie die ANDEREN abstimmen werden.
export type Prediction = "a_wins" | "b_wins" | "tie";

// Eine Frage, eingefroren beim Spielstart.
// Wir kopieren die Frage in die Spielzeile, damit spätere Änderungen
// am Fragenpool oder gelöschte Community Fragen das laufende Spiel
// nicht kaputt machen.
export interface GameQuestionSnapshot {
  id: number;
  a: string;
  b: string;
  flavor?: string | null;
  source?: "builtin" | "community";
}

// Ein komplettes Spiel (eine Zeile in der "games" Tabelle).
export interface Game {
  id: string;
  code: string;                               // 6 stelliger Beitrittscode
  host_secret: string;                        // Geheimnis nur der Host kennt
  phase: GamePhase;
  current_question_index: number;
  total_questions: number;
  question_pack_id: string;
  question_order: number[];                   // Legacy: nur die Frage IDs
  questions_snapshot: GameQuestionSnapshot[]; // bevorzugt: ganze Frage
  scoring_modes: ScoringMode[];               // pro Runde: "majority" oder "minority"
  question_starts_at: string | null;          // Server Timestamp = Countdown Anker
  question_duration_seconds: number;
  created_at: string;
}

// Eine Frage, die eine Spieler:in eingereicht hat (Tabelle
// "submitted_questions"). IDs starten bei 10000, damit sie sich nicht mit
// den eingebauten Fragen aus lib/questions.ts überschneiden.
export interface SubmittedQuestion {
  id: number;
  a: string;
  b: string;
  flavor: string | null;
  submitter_name: string | null;
  submitted_at: string;
  approved: boolean;
}

// Eine beigetretene Spieler:in.
export interface Player {
  id: string;
  game_id: string;
  nickname: string;
  avatar: string;        // Emoji aus AVATARS in game-helpers.ts
  score: number;
  joined_at: string;
}

// Eine abgegebene Stimme zu einer bestimmten Frage.
// Ein Spieler darf pro question_index nur EINMAL voten (Unique
// Constraint in der DB).
export interface Vote {
  id: string;
  game_id: string;
  player_id: string;
  question_index: number;
  choice: Choice;
  prediction: Prediction | null;
  points_awarded: number | null;
  created_at: string;
}
