import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { Screen } from "@/components/ui";
import { AccountActions } from "./AccountActions";

export const metadata = { title: "Konto" };

/**
 * Das Konto (DESIGN.md „Konto"): Avatar-Kreis mit Initiale, darunter die
 * E-Mail-Adresse als Kopfzeile, dann Abmelden/Löschen.
 *
 * Kein „Bearbeiten"-Knopf neben dem Avatar wie im Design-Canvas — es gibt
 * kein editierbares Profilfeld (nur die E-Mail-Adresse, die am Login hängt),
 * und ein Knopf ohne eigene Funktion bleibt bewusst weg.
 *
 * Bis auf die E-Mail-Adresse steht hier nichts, was vom Server kommen müsste —
 * die Knöpfe zum Abmelden und Löschen arbeiten ohnehin im Browser. Also ist
 * alles außer der einen Zeile statisch und damit in der App Shell; nur die
 * Kopfzeile strömt nach.
 */
export default function AccountPage() {
  return (
    <Screen title="Konto">
      <Suspense fallback={<AvatarHeader initial={null} email={null} />}>
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

  const initial = user.email?.trim().charAt(0).toUpperCase() ?? null;
  return <AvatarHeader initial={initial} email={user.email} />;
}

function AvatarHeader({
  initial,
  email,
}: {
  initial: string | null;
  email: string | null;
}) {
  return (
    <div className="flex items-center gap-4">
      <span
        aria-hidden
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[24px] font-bold"
        style={{ background: "#DCE3D9", color: "#33422F" }}
      >
        {initial}
      </span>
      <p className="min-w-0 truncate font-display text-[17px] font-bold text-text">
        {email ?? " "}
      </p>
    </div>
  );
}
