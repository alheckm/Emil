import { redirect } from "next/navigation";
import { getCurrentUser, getServerSupabase } from "@/lib/server/supabase";
import { listHouseholds } from "@/lib/data/households";
import { Screen } from "@/components/ui";
import { StartForms } from "./StartForms";

export const metadata = { title: "Haushalt" };

export default async function HouseholdStartPage() {
  if (!(await getCurrentUser())) redirect("/anmelden");

  // Wer schon in einem Haushalt ist, hat hier nichts verloren — sonst legt ein
  // zweiter Klick versehentlich einen zweiten Haushalt an.
  const supabase = await getServerSupabase();
  if (supabase) {
    const households = await listHouseholds(supabase);
    if (households.ok && households.value.length > 0) redirect("/haushalt");
  }

  return (
    <Screen
      title="Haushalt"
      lead="Emil teilt Rezepte und Einkaufsliste innerhalb eines Haushalts. Leg einen an oder tritt einem bei."
    >
      <StartForms />
    </Screen>
  );
}
