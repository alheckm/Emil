import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { Section, Screen } from "@/components/ui";
import { RegisterForm } from "./RegisterForm";

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


export const metadata = { title: "Konto anlegen" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <Screen
      title="Konto anlegen"
      lead="Danach legst du einen Haushalt an oder trittst mit einem Code einem bestehenden bei."
    >
      <Section>
        <RegisterForm />
      </Section>
      <p className="text-center text-[15px]">
        <Link href="/anmelden" className="text-muted underline underline-offset-4">
          Ich habe schon ein Konto
        </Link>
      </p>
    </Screen>
  );
}
