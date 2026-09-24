import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { getMyProfile } from "@/lib/server/profile";
import { Avatar, Button, Field, Screen } from "@/components/ui";
import { AccountProfile } from "./AccountProfile";

export const metadata = { title: "Profil bearbeiten" };

/**
 * „Profil bearbeiten" (DESIGN.md „Konto"): Avatar, Klarname, E-Mail — erreicht
 * über „Bearbeiten" im Konto-Hub (`/einstellungen`), der seit dem Redesign die
 * eigentliche Kontoübersicht ist. Abmelden und Löschen liegen seither dort
 * bzw. auf `/einstellungen/konto/loeschen`, nicht mehr hier.
 *
 * Name und Foto kommen aus `getMyProfile()` — derselben `"use cache:
 * private"`-Funktion, die auch die Tabbar füllt (`layout.tsx`). Dieselbe
 * Anfrage lädt beides also nur einmal, und die Kopfzeile bleibt dadurch Teil
 * der App Shell statt zwei eigene Netzrunden zu brauchen.
 */
export default function AccountPage() {
  return (
    <Screen title="Profil bearbeiten">
      <Suspense fallback={<AccountProfileFallback />}>
        <AccountHeader />
      </Suspense>
    </Screen>
  );
}

async function AccountHeader() {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const { displayName, avatarPath, avatarUrl } = await getMyProfile();

  return (
    <AccountProfile
      userId={user.id}
      email={user.email}
      initialDisplayName={displayName ?? ""}
      initialAvatarPath={avatarPath}
      initialAvatarUrl={avatarUrl}
    />
  );
}

/**
 * Reserviert exakt den Platz, den `AccountProfile` unten füllt (Avatar,
 * beide Textknöpfe, Namensfeld, E-Mail-Zeile, Knopf) — sonst springt der
 * Screen, sobald die Kopfzeile nachkommt.
 */
function AccountProfileFallback() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 pt-2">
        <Avatar url={null} initial={null} size={96} />
        <span className="min-h-11 px-2 text-[14px] font-semibold text-transparent">
          Foto ändern
        </span>
      </div>
      <Field
        label="Name"
        hint="Wird im Haushalt und bei zugewiesenen Aufgaben angezeigt"
        value=""
        readOnly
        disabled
      />
      <div className="space-y-2">
        <span className="block px-0.5 pb-1 text-[12px] font-bold tracking-[0.06em] text-transparent uppercase">
          E-Mail
        </span>
        <p className="text-[15px] text-transparent">—</p>
      </div>
      <Button disabled>Speichern</Button>
    </div>
  );
}
