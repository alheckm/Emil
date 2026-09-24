import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { Section, Screen } from "@/components/ui";
import { LoginForm } from "./LoginForm";

/**
 * Diese Route darf blockieren — und zwar dauerhaft.
 *
 * Sie entscheidet, ob jemand angemeldet ist, und leitet entsprechend weiter.
 * Diese Antwort vorab auszuliefern hieße, kurz den falschen Bildschirm zu
 * zeigen; im Standalone-Modus vom Home-Bildschirm sieht man genau das
 * besonders deutlich. Und sie wird einmal beim Start durchlaufen, nicht in der
 * Schleife aus Tippen und Warten, um die es beim Rest der App geht.
 *
 * `instant = false` schaltet deshalb nur die Prüfung ab, die sonst bei jedem
 * Entwicklungslauf einen Hinweis für etwas melden würde, das hier Absicht ist.
 */
export const instant = false;


export const metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { fehler } = await searchParams;

  return (
    <Screen
      title="emil"
      lead="Rezepte, Portionen, Einkaufsliste — geteilt im Haushalt."
      tabbar={false}
    >
      <Section>
        <LoginForm initialError={fehler} />
      </Section>

      <div className="space-y-2 text-center text-[15px]">
        <p>
          <Link href="/registrieren" className="text-accent underline underline-offset-4">
            Neu hier? Konto anlegen
          </Link>
        </p>
        <p>
          <Link
            href="/passwort-vergessen"
            className="text-muted underline underline-offset-4"
          >
            Passwort vergessen
          </Link>
        </p>
        <p>
          <Link
            href="/datenschutz"
            className="text-muted underline underline-offset-4"
          >
            Datenschutz
          </Link>
        </p>
      </div>
    </Screen>
  );
}
