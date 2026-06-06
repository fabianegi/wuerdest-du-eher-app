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
| Hosting     | Vercel und Supabase |

## Lokal starten

```bash
npm install
cp .env.local.example .env.local   # danach die Supabase-Werte eintragen
npm run dev
```

Die App läuft anschließend auf http://localhost:3000. Das Datenbankschema liegt in `supabase/schema.sql` und wird einmalig im Supabase SQL-Editor ausgeführt.

## Lizenz

CC BY-NC 4.0 (nicht-kommerziell, mit Namensnennung), Fabian Egenberger. Details in der Datei `LICENSE`.
