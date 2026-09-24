import { redirect } from "next/navigation";
import { getCurrentUser, getServerSupabase } from "@/lib/server/supabase";
import { listHouseholds } from "@/lib/data/households";
import { Screen } from "@/components/ui";
import { StartForms } from "./StartForms";

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


export const metadata = { title: "Haushalt" };

export default async function HouseholdStartPage() {
  if (!(await getCurrentUser())) redirect("/anmelden");

  // Wer schon in einem Haushalt ist, hat hier nichts verloren — sonst legt ein
  // zweiter Klick versehentlich einen zweiten Haushalt an.
  const supabase = await getServerSupabase();
  if (supabase) {
    const households = await listHouseholds(supabase);
    if (households.ok && households.value.length > 0) redirect("/liste");
  }

  return (
    <Screen
      title="Haushalt"
      lead="Emil teilt Rezepte und Einkaufsliste innerhalb eines Haushalts. Leg einen an oder tritt einem bei."
      tabbar={false}
    >
      <StartForms />
    </Screen>
  );
}
