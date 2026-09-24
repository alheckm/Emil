import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getServerSupabase } from "@/lib/server/supabase";
import { getAvatarUrl, getProfile } from "@/lib/data/profiles";
import { Avatar, Screen } from "@/components/ui";
import { AccountActions } from "./AccountActions";
import { AccountProfile } from "./AccountProfile";

export const metadata = { title: "Konto" };

/**
 * Das Konto (DESIGN.md „Konto"): Avatar-Kreis, darunter Klarname und
 * E-Mail-Adresse, dann Abmelden/Löschen.
 *
 * Name und Foto kommen aus der Datenbank und laufen deshalb hinter einer
 * eigenen Suspense-Grenze (`AccountProfile` selbst ist ein Client-Baustein,
 * weil beides sich hier bearbeiten lässt). Abmelden und Löschen bleiben
 * unverändert rein browserseitig.
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

  const supabase = await getServerSupabase();
  const profile = supabase ? await getProfile(supabase, user.id) : null;
  const avatarPath = profile?.ok ? (profile.value?.avatarPath ?? null) : null;
  const avatarUrl = supabase ? await getAvatarUrl(supabase, avatarPath) : null;
  const displayName = profile?.ok ? (profile.value?.displayName ?? "") : "";

  return (
    <AccountProfile
      userId={user.id}
      email={user.email}
      initialDisplayName={displayName}
      initialAvatarPath={avatarPath}
      initialAvatarUrl={avatarUrl}
    />
  );
}

function AccountProfileFallback() {
  return (
    <div className="flex items-center gap-4">
      <Avatar url={null} initial={null} size={72} />
      <p className="min-w-0 truncate font-display text-[17px] font-bold text-text">
        {" "}
      </p>
    </div>
  );
}
