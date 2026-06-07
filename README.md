# Würdest du eher …? 

Live-Abstimmungs-App im Stil von Kahoot und Mentimeter für „Würdest du eher …?"-Dilemmafragen. Der Host projiziert die Beamer-Ansicht, die Mitspielenden treten per QR-Code oder sechsstelligem Code vom Handy bei. Die Synchronisation läuft in Echtzeit über Supabase.

## Features

- Beamer-Ansicht mit QR-Code und Beitrittscode
- Beitritt vom Handy mit Nickname und Avatar
- Runden-Countdown, synchron über Supabase Realtime
- Animierte Balkendiagramme bei der Auflösung
- Prognosebasiertes Punktesystem, das ehrliches Abstimmen belohnt
- Siegerehrung mit Konfetti
- Eigener Fragenpool plus von Mitspielenden eingereichte Fragen

## Tech-Stack

| Ebene       | Technik |
|-------------|---------|
| Frontend    | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend     | Supabase (Postgres und Realtime) |
| Animation   | Framer Motion, canvas-confetti |
| QR-Code     | qrcode.react |
| Hosting     | Vercel und Supabase |

## Setup in fünf Minuten

```bash
git clone https://github.com/fabianegi/wuerdest-du-eher-app.git
cd wuerdest-du-eher-app
npm install
```

1. Auf [supabase.com](https://supabase.com) ein kostenloses Projekt anlegen.
2. Unter **Project Settings, API** die `Project URL` und den `anon public key` kopieren.
3. Im **SQL-Editor** den kompletten Inhalt von [`supabase/schema.sql`](./supabase/schema.sql) ausführen. Das Skript legt alle Tabellen, Indizes und RLS-Policies an und aktiviert Realtime.
4. Zugangsdaten eintragen:

```bash
cp .env.local.example .env.local
# danach NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen
```

5. Entwicklungsserver starten:

```bash
npm run dev
```

Die App läuft anschließend auf http://localhost:3000. Auf der Startseite ein Spiel erstellen, die Beamer-Seite projizieren und `/play` auf dem Handy öffnen.

## Architektur

```
Host-Browser (Beamer)  <-- Realtime -->  Next.js (Vercel)  <-- Realtime -->  Supabase (Postgres)
        |                                                                          |
        +--------------------------- Realtime-Push -------------------------------+
                                          |
                                   Spieler:in (Handy)
```

Jedes Spiel hat genau ein Feld `phase` in der Tabelle `games`:

```
lobby  ->  question  ->  reveal  ->  question  ->  ...  ->  final
```

Der Host ändert die Phase per Update auf `games`. Alle Clients (Host und Spieler) sind über Supabase Realtime mit dieser Zeile verbunden und reagieren sofort auf Phasenwechsel. Beim `reveal` sammelt der Host die Stimmen, bestimmt die Gewinnerseite und verteilt die Punkte. Es gibt keinen eigenen Backend-Code.

## Projektstruktur

```
app/         Routen (Landing, Host-Ansicht, Spieler-Ansicht), Layout, globale Styles
components/  UI-Bausteine (QR-Code, Countdown, Balken, Avatare, Konfetti, Formular)
lib/         Supabase-Client und Typen, Fragenpool, Spiel-Logik (Code, Scoring)
supabase/    SQL-Schema, RLS-Policies, Realtime-Publication
```

## Punktesystem

Die vollständige Logik steht in `lib/game-helpers.ts`. Punkte gibt es nicht für die eigene Wahl, sondern für eine richtige Prognose, wie die Mehrheit abstimmt. So lohnt sich ehrliches statt taktisches Abstimmen.

| Punktequelle           | Wert | Wann |
|------------------------|------|------|
| Teilnahme              | +20  | für jede abgegebene Stimme |
| Knappes Rennen erkannt | +80  | Prognose „ungefähr 50/50" stimmt |
| Knappe Mehrheit        | +60  | Prognose stimmt, Sieger zwischen 55 und 65 Prozent |
| Klare Mehrheit         | +100 | Prognose stimmt, Sieger ab 65 Prozent |
| Mut-Bonus              | +150 | bewusst in der Minderheit geblieben |

## Eigene Fragen hinzufügen

- **Über die Oberfläche:** Auf der Startseite gibt es ein Formular zum Einreichen eigener Dilemmas. Sie landen sofort im Pool und sind im manuellen Picker auswählbar.
- **Im Code:** In [`lib/questions.ts`](./lib/questions.ts) einen Eintrag mit eindeutiger `id` ergänzen.

## Datenschutz

- Schriftarten werden über `next/font` lokal von der App ausgeliefert, kein Google-CDN und kein Tracking.
- Es werden keine personenbezogenen Daten erhoben außer dem selbst gewählten Nickname.
- Supabase wird in der EU gehostet.

## Sicherheitshinweis

Das Projekt nutzt bewusst sehr offene RLS-Policies, weil es ein Prototyp für den Hörsaal ist. Für einen echten Produktiveinsatz sollten Schreibzugriffe enger gefasst werden (Host-Aktionen nur mit Geheimnis, Beitritt nur in der Lobby, Stimmen nur während der laufenden Frage).

## Lizenz

CC BY-NC 4.0 (nicht-kommerziell, mit Namensnennung), Fabian Egenberger. Details in der Datei `LICENSE`.
