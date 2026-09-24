import Link from "next/link";
import { Section, Screen } from "@/components/ui";
import { ResetForm } from "./ResetForm";

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


export const metadata = { title: "Passwort vergessen" };

export default function ForgotPasswordPage() {
  return (
    <Screen
      title="Passwort vergessen"
      lead="Wir schicken dir einen Link, mit dem du ein neues setzen kannst."
      tabbar={false}
    >
      <Section>
        <ResetForm />
      </Section>
      <p className="text-center text-[15px]">
        <Link href="/anmelden" className="text-muted underline underline-offset-4">
          Zurück zur Anmeldung
        </Link>
      </p>
    </Screen>
  );
}
