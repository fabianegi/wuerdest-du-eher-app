import { createClient } from "@supabase/supabase-js";

// =====================================================================
// Supabase Client (läuft im Browser)
// ---------------------------------------------------------------------
// Wir reden direkt aus dem Browser mit Supabase, ohne eigenen Backend.
// Mit dem öffentlichen "anon"-Key bekommt jede:r Lese und Schreibrechte.
// Das ist okay, weil unsere RLS Policies (siehe supabase/schema.sql)
// für diesen Klassenraum Prototypen bewusst sehr offen sind.
//
// Für Production müsste man den Schreibzugriff über strengere RLS
// Policies einschränken.
//
// Tipp für später: Die TypeScript Typen unserer Tabellen leben in
// lib/supabase/types.ts und werden an den Aufrufstellen per Cast
// angewendet. Für ein größeres Projekt würde man stattdessen
//   npx supabase gen types typescript --project-id <id>
// nehmen und den Client als createClient<Database> typisieren.
// =====================================================================
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      // Maximal 20 Events pro Sekunde reichen locker für ein Klassenspiel.
      params: { eventsPerSecond: 20 },
    },
  },
);
