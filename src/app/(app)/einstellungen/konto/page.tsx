import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { getMyProfile } from "@/lib/server/profile";
import { Avatar, Button, Field, Screen } from "@/components/ui";
import { AccountActions } from "./AccountActions";
import { AccountProfile } from "./AccountProfile";

export const metadata = { title: "Konto" };

/**
 * Das Konto (DESIGN.md „Konto"): Avatar-Kreis, darunter Klarname und
 * E-Mail-Adresse, dann Abmelden/Löschen.
 *
 * Name und Foto kommen aus `getMyProfile()` — derselben `"use cache:
 * private"`-Funktion, die auch die Tabbar füllt (`layout.tsx`). Dieselbe
 * Anfrage lädt beides also nur einmal, und die Kopfzeile bleibt dadurch Teil
 * der App Shell statt zwei eigene Netzrunden zu brauchen.
 */
export default function AccountPage() {
  return (
    <Screen title="Konto">
      <Suspense fallback={<AccountProfileFallback />}>
        <AccountHeader />
      </Suspense>

      <div className="h-px bg-border" />

      <AccountActions />
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
 * E-Mail-Zeile, Namensfeld, Knopf) — sonst springt „Abmelden" nach unten,
 * sobald die Kopfzeile nachkommt.
 */
function AccountProfileFallback() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar url={null} initial={null} size={72} />
        <p className="min-w-0 truncate font-display text-[17px] font-bold text-text">
          {" "}
        </p>
      </div>
      <div className="space-y-2">
        <Field
          label="Name"
          hint="Wird im Haushalt und bei zugewiesenen Aufgaben angezeigt"
          value=""
          readOnly
          disabled
        />
        <Button variant="secondary" disabled>
          Namen speichern
        </Button>
      </div>
    </div>
  );
}
