-- =====================================================================
-- "Würdest du eher...?" · Supabase Schema
-- =====================================================================
-- Dieses Skript einmal pro Supabase Projekt im SQL Editor ausführen.
-- Es legt alle Tabellen, Indizes, Realtime Hooks und RLS Policies an.
--
-- Anschließend findest du unter Settings > API die beiden Werte
--   NEXT_PUBLIC_SUPABASE_URL
--   NEXT_PUBLIC_SUPABASE_ANON_KEY
-- die in die Datei .env.local kopiert werden.
-- =====================================================================


-- 1) Extensions -------------------------------------------------------
-- pgcrypto liefert uns gen_random_uuid() für die Primärschlüssel.
create extension if not exists "pgcrypto";


-- 2) Tabellen ---------------------------------------------------------

-- Eine Zeile pro laufendem oder beendetem Spiel.
-- "phase" ist die zentrale State Machine, alle Clients hören darauf.
create table if not exists public.games (
  id                         uuid primary key default gen_random_uuid(),
  code                       text unique not null,                   -- 6 stelliger Beitrittscode
  host_secret                text not null,                          -- Geheimnis nur der Host kennt
  phase                      text not null default 'lobby'
                             check (phase in ('lobby','question','reveal','final')),
  current_question_index     int  not null default 0,                -- 0 basierter Index in question_order
  total_questions            int  not null default 10,
  question_pack_id           text not null default 'dhbw-loerrach',  -- aktuell ungenutzt, für spätere Pakete
  question_order             jsonb not null default '[]'::jsonb,     -- Legacy: nur Frage IDs, z. B. [3,7,1,4]
  questions_snapshot         jsonb not null default '[]'::jsonb,     -- bevorzugt: ganze Fragen eingefroren
  scoring_modes              jsonb not null default '[]'::jsonb,     -- pro Runde "majority" oder "minority"
  question_starts_at         timestamptz,                            -- Anker für den Countdown
  question_duration_seconds  int  not null default 20,
  created_at                 timestamptz not null default now()
);

-- Community eingereichte Fragen.
-- IDs starten bei 10000, damit sie sich nicht mit den eingebauten
-- Fragen aus lib/questions.ts überschneiden.
create table if not exists public.submitted_questions (
  id             int generated always as identity (start with 10000) primary key,
  a              text not null,
  b              text not null,
  flavor         text,
  submitter_name text,
  submitted_at   timestamptz not null default now(),
  approved       boolean not null default true,        -- Klassenraum: alles direkt freigegeben
  -- Längen Constraints für sauberes UI Layout und gegen Spam.
  constraint submitted_questions_a_len check (length(a) between 3 and 200),
  constraint submitted_questions_b_len check (length(b) between 3 and 200),
  constraint submitted_questions_flavor_len check (flavor is null or length(flavor) <= 200),
  constraint submitted_questions_submitter_len check (submitter_name is null or length(submitter_name) <= 40)
);

-- Eine Zeile pro beigetretener Spieler:in.
-- ON DELETE CASCADE: wird das Spiel gelöscht, verschwinden auch die Spieler.
create table if not exists public.players (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references public.games(id) on delete cascade,
  nickname  text not null,
  avatar    text not null,            -- Emoji aus AVATARS in lib/game-helpers.ts
  score     int  not null default 0,
  joined_at timestamptz not null default now(),
  unique (game_id, nickname)          -- Nicknames innerhalb eines Spiels eindeutig
);

-- Eine Zeile pro abgegebener Stimme.
-- Unique Constraint sorgt dafür, dass eine Spieler:in pro Frage nur
-- einmal voten kann.
create table if not exists public.votes (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid not null references public.games(id) on delete cascade,
  player_id       uuid not null references public.players(id) on delete cascade,
  question_index  int  not null,
  choice          text not null check (choice in ('a','b')),
  -- Room Read: Was glaubt die Spieler:in, wie die Mehrheit der ANDEREN wählt?
  prediction      text check (prediction is null or prediction in ('a_wins','b_wins','tie')),
  points_awarded  int,                -- aktuell ungenutzt, Reserve für Replay
  created_at      timestamptz not null default now(),
  unique (player_id, question_index)
);


-- 3) Indizes für schnelle Abfragen ------------------------------------
-- Spieler eines Spiels schnell nachladen.
create index if not exists idx_players_game on public.players(game_id);
-- Stimmen einer bestimmten Runde auswerten.
create index if not exists idx_votes_game_q on public.votes(game_id, question_index);
-- Spiel über den 6 stelligen Code finden.
create index if not exists idx_games_code on public.games(code);
-- Frische Community Fragen oben listen.
create index if not exists idx_submitted_questions_approved_time
  on public.submitted_questions(approved, submitted_at desc);


-- 4) Realtime aktivieren ---------------------------------------------
-- Supabase muss diese Tabellen in seine "supabase_realtime" Publication
-- aufnehmen, damit Clients per WebSocket Live Änderungen empfangen.
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.submitted_questions;


-- 5) Row Level Security (MVP: sehr permissiv) ------------------------
-- ACHTUNG: Für einen Klassenraum Prototyp ist das absichtlich offen.
-- Für Production sollte man die Policies enger fassen, z. B.:
--   - games UPDATE nur, wenn ein passender host_secret Header kommt.
--   - players INSERT nur, solange das Spiel noch in der Lobby ist.
--   - votes INSERT nur während phase = 'question' und für die eigene
--     player_id.
-- Siehe README, Abschnitt "Security Hinweis".
alter table public.games               enable row level security;
alter table public.players             enable row level security;
alter table public.votes               enable row level security;
alter table public.submitted_questions enable row level security;

-- Falls das Skript ein zweites Mal läuft, alte Policies erst weg.
drop policy if exists "games_public_rw"       on public.games;
drop policy if exists "players_public_rw"     on public.players;
drop policy if exists "votes_public_rw"       on public.votes;
drop policy if exists "submissions_public_rw" on public.submitted_questions;

-- Komplett offene Policies: jede:r mit dem anon Key darf alles.
create policy "games_public_rw"       on public.games               for all using (true) with check (true);
create policy "players_public_rw"     on public.players             for all using (true) with check (true);
create policy "votes_public_rw"       on public.votes               for all using (true) with check (true);
create policy "submissions_public_rw" on public.submitted_questions for all using (true) with check (true);
