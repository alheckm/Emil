import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { Section, Screen } from "@/components/ui";
import { TextSkeleton } from "@/components/skeletons";
import { AccountActions } from "./AccountActions";

export const metadata = { title: "Konto" };

/**
 * Das Konto.
 *
 * Bis auf die E-Mail-Adresse steht hier nichts, was vom Server kommen müsste —
 * die Knöpfe zum Abmelden und Löschen arbeiten ohnehin im Browser. Also ist
 * alles außer der einen Zeile statisch und damit in der App Shell; nur die
 * Adresse strömt nach.
 */
export default function AccountPage() {
  return (
    <Screen title="Konto">
      <Section>
        <dl className="space-y-2 text-[15px]">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">E-Mail</dt>
            <Suspense fallback={<dd><TextSkeleton /></dd>}>
              <Email />
            </Suspense>
          </div>
        </dl>
      </Section>

      <AccountActions />
    </Screen>
  );
}

async function Email() {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  return <dd className="truncate font-medium">{user.email}</dd>;
}
