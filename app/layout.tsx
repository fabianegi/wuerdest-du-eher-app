import type { Metadata } from "next";
import { Fraunces, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Drei Schriften, alle über next/font geladen. Vorteil: Next.js
// hostet die Font Dateien selbst, wir laden nichts vom Google CDN
// (DSGVO konform, wichtig für die DHBW Abgabe).
//   Fraunces:    expressive Serif für große Headlines
//   Bricolage:   moderner Sans, alles Fließtext
//   JetBrains:   Mono für Codes, Zahlen und Stempel Labels
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Wird von Next.js automatisch in den <head> gerendert.
// Wichtig u. a. für Browser Tabs, Bookmarks und Social Sharing.
export const metadata: Metadata = {
  title: "Würdest du eher…? · Live Dilemma Quiz",
  description:
    "Ein Live Abstimmungs Game für Vorlesungen, Partys und Team Events. " +
    "Gebaut von Fabian und Team · DHBW Lörrach · Web Entwicklung 2. Sem.",
};

// Root Layout: umschließt JEDE Seite der App. Hier setzen wir die
// Sprache (lang="de" für Screen Reader und Suchmaschinen) und
// reichen die drei Font Variablen als CSS Custom Properties an die
// untergeordneten Komponenten durch.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${fraunces.variable} ${bricolage.variable} ${jetbrains.variable}`}
    >
      <body>
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
