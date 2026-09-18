import Link from "next/link";
import { getCurrentUser } from "@/lib/server/supabase";
import { Section, Notice, Screen } from "@/components/ui";
import { NewPasswordForm } from "./NewPasswordForm";

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


export const metadata = { title: "Neues Passwort" };

/**
 * Hierher führt der Link aus der Zurücksetzen-Mail — über /auth/callback, das
 * den Code vorher gegen eine Sitzung getauscht hat. Ohne diese Sitzung ist die
 * Seite nutzlos, und das soll man sofort sehen statt erst nach dem Absenden.
 */
export default async function NewPasswordPage() {
  const user = await getCurrentUser();

  return (
    <Screen title="Neues Passwort">
      {user ? (
        <Section>
          <NewPasswordForm />
        </Section>
      ) : (
        <>
          <Notice tone="error">
            Dieser Link gilt nicht mehr. Links aus der Zurücksetzen-Mail sind
            einmalig und laufen nach einer Stunde ab.
          </Notice>
          <p className="text-center text-[15px]">
            <Link
              href="/passwort-vergessen"
              className="text-accent underline underline-offset-4"
            >
              Neuen Link anfordern
            </Link>
          </p>
        </>
      )}
    </Screen>
  );
}
