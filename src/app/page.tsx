import { redirect } from "next/navigation";
import { SUPABASE_MISSING_MESSAGE, getSupabaseConfig } from "@/lib/server/env";
import { getCurrentUser } from "@/lib/server/supabase";
import { Notice, Screen } from "@/components/ui";

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

/**
 * Die Weiche — und sonst nichts mehr.
 *
 * Früher war das zusätzlich das Inhaltsverzeichnis: ein Bildschirm mit vier
 * Verweisen auf die Bereiche der App. Mit der Tab-Leiste sind diese vier
 * Bereiche dauerhaft erreichbar, und ein eigener Startbildschirm davor wäre
 * eine Sackgasse — wer von hier auf einen Tab tippt, käme nie wieder zurück.
 *
 * Also geht es direkt auf die Einkaufsliste. Das ist ohnehin der Bildschirm,
 * der im Supermarkt in Sekunden da sein muss; ein Zwischenschritt mit einem
 * Knopf darauf hat ihn nur langsamer gemacht.
 *
 * Nicht angemeldet → Anmeldung, kein Haushalt → Haushalt anlegen: diese
 * Prüfungen gehören auf den Server. Im Browser blitzte sonst kurz der falsche
 * Bildschirm auf, und im Standalone-Modus sieht man genau das besonders
 * deutlich. Die Haushalts-Weiche übernimmt `requireHousehold()` auf /liste.
 */
export default async function Home() {
  if (!getSupabaseConfig()) {
    return (
      <Screen title="Emil" tabbar={false}>
        <Notice tone="error">{SUPABASE_MISSING_MESSAGE}</Notice>
      </Screen>
    );
  }

  if (!(await getCurrentUser())) redirect("/anmelden");
  redirect("/liste");
}
