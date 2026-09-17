import Link from "next/link";
import { redirect } from "next/navigation";
import { SUPABASE_MISSING_MESSAGE, getSupabaseConfig } from "@/lib/server/env";
import { getCurrentUser, getServerSupabase } from "@/lib/server/supabase";
import { listHouseholds } from "@/lib/data/households";
import { Notice, RowLink, Screen } from "@/components/ui";

/**
 * Startseite — die Weiche und das Inhaltsverzeichnis.
 *
 * Nicht angemeldet → Anmeldung, kein Haushalt → Haushalt anlegen. Diese
 * Prüfung gehört auf den Server; im Browser blitzte sonst kurz der falsche
 * Bildschirm auf.
 *
 * Die Einkaufsliste steht bewusst oben und als einziger farbiger Knopf: sie
 * ist der Bildschirm, der im Supermarkt in Sekunden erreichbar sein muss.
 */
export default async function Home() {
  if (!getSupabaseConfig()) {
    return (
      <Screen title="Emil">
        <Notice tone="error">{SUPABASE_MISSING_MESSAGE}</Notice>
      </Screen>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const supabase = await getServerSupabase();
  if (!supabase) redirect("/anmelden");

  const households = await listHouseholds(supabase);
  if (!households.ok) {
    return (
      <Screen title="Emil">
        <Notice tone="error">{households.error}</Notice>
      </Screen>
    );
  }
  if (households.value.length === 0) redirect("/haushalt/start");

  const household = households.value[0];

  return (
    <Screen title="Emil" lead={household.name}>
      <Link
        href="/liste"
        className="flex h-14 items-center justify-center rounded-xl bg-accent px-4 text-lg font-medium text-accent-text active:opacity-70"
      >
        Einkaufsliste
      </Link>

      <nav className="space-y-2">
        <RowLink href="/rezepte">Rezepte</RowLink>
        <RowLink href="/haushalt">Haushalt &amp; Einladungen</RowLink>
        <RowLink href="/konto">Konto</RowLink>
      </nav>
    </Screen>
  );
}
