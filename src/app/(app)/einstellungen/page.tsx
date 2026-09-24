import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { getMyProfile } from "@/lib/server/profile";
import { requireHousehold } from "@/lib/server/household";
import { listHouseholds, listMembersWithProfiles } from "@/lib/data/households";
import { Avatar, Notice, Screen, SectionEyebrow, SettingsRow } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { HouseholdSwitcher } from "./HouseholdSwitcher";
import { SignOutButton } from "./SignOutButton";

export const metadata = { title: "Konto" };

/**
 * Der Konto-Tab (DESIGN.md „Konto"): ein Screen statt der früheren, nackten
 * Verteilerseite — Profilkopf, der aktive Haushalt mit Mitgliedern, ein paar
 * Kontozeilen, Löschen und Abmelden.
 *
 * Drei unabhängige Suspense-Grenzen, weil sie unterschiedlich teuer sind:
 * `ProfileHeader` (dieselbe `getMyProfile()`-Runde wie die Tabbar),
 * `HouseholdSwitcherSection` (Haushalte auflisten) und `MemberRows` (zusätzlich
 * Profile und signierte Foto-URLs aller Mitglieder). Der statische Rahmen —
 * Überschriften, Kontozeilen, Löschen, Abmelden — steht davon unabhängig
 * sofort.
 */
export default function SettingsPage() {
  return (
    <Screen title="Konto">
      <Suspense fallback={<ProfileHeaderFallback />}>
        <ProfileHeader />
      </Suspense>

      <div className="h-px bg-border" />

      <div>
        <SectionEyebrow>Haushalt</SectionEyebrow>
        <Suspense fallback={<HouseholdSwitcherFallback />}>
          <HouseholdSwitcherSection />
        </Suspense>
        <Suspense fallback={<MemberRowsFallback />}>
          <MemberRows />
        </Suspense>
        <SettingsRow
          href="/einstellungen/haushalt"
          leading={
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-dashed border-inactive"
            >
              <PlusIcon className="h-3.5 w-3.5 text-muted" strokeWidth={2.2} />
            </span>
          }
        >
          Jemanden einladen
        </SettingsRow>
      </div>

      <div className="h-px bg-border" />

      <div>
        <SectionEyebrow>Konto</SectionEyebrow>
        <SettingsRow href="/passwort-neu">Passwort ändern</SettingsRow>
        <SettingsRow href="/datenschutz">Datenschutz</SettingsRow>
      </div>

      <div className="h-px bg-border" />

      <SettingsRow href="/einstellungen/konto/loeschen" variant="danger">
        Konto löschen
      </SettingsRow>

      <SignOutButton />
    </Screen>
  );
}

async function ProfileHeader() {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const { displayName, avatarUrl, initial } = await getMyProfile();
  const hasName = !!displayName?.trim();

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/einstellungen/konto"
        aria-label="Profilfoto ändern"
        className="shrink-0 rounded-full press-flat tap-target"
      >
        <Avatar url={avatarUrl} initial={initial} size={64} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[17px] font-bold text-text">
          {hasName ? displayName : (user.email ?? " ")}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {hasName ? (
            user.email
          ) : (
            <Link href="/einstellungen/konto" className="underline underline-offset-2">
              Namen hinzufügen
            </Link>
          )}
        </p>
      </div>
      <Link
        href="/einstellungen/konto"
        className="min-h-11 shrink-0 px-1 text-[13px] font-semibold text-text press-flat tap-target"
      >
        Bearbeiten
      </Link>
    </div>
  );
}

function ProfileHeaderFallback() {
  return (
    <div className="flex items-center gap-4">
      <Avatar url={null} initial={null} size={64} />
      <p className="min-w-0 flex-1 truncate font-display text-[17px] font-bold text-text"> </p>
    </div>
  );
}

async function HouseholdSwitcherSection() {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const context = await requireHousehold();
  if (!context.ok) return <Notice tone="error">{context.error}</Notice>;

  const households = await listHouseholds(context.supabase, user.id);
  if (!households.ok) return <Notice tone="error">{households.error}</Notice>;

  return (
    <HouseholdSwitcher households={households.value} activeId={context.household.id} />
  );
}

function HouseholdSwitcherFallback() {
  return (
    <div className="flex min-h-[52px] items-center py-2">
      <span className="font-display text-[15px] font-bold text-transparent">Haushalt</span>
    </div>
  );
}

async function MemberRows() {
  const context = await requireHousehold();
  if (!context.ok) return null;

  const user = await getCurrentUser();
  const members = await listMembersWithProfiles(context.supabase, context.household.id);
  if (!members.ok) return <p className="text-[15px] text-muted">{members.error}</p>;

  return (
    <>
      {members.value.map((member) => {
        const isSelf = member.userId === user?.id;
        const name = member.displayName || (isSelf ? "Du" : "Mitbewohner:in");
        return (
          <div key={member.userId} className="flex min-h-[52px] items-center gap-3 py-2">
            <Avatar url={member.avatarUrl} initial={name.charAt(0).toUpperCase()} size={32} />
            <span className="min-w-0 flex-1 truncate text-[15px] text-text">{name}</span>
            {isSelf && <span className="shrink-0 text-[13px] text-muted">Du</span>}
          </div>
        );
      })}
    </>
  );
}

function MemberRowsFallback() {
  return (
    <div className="flex min-h-[52px] items-center gap-3 py-2">
      <Avatar url={null} initial={null} size={32} />
      <span className="text-[15px] text-transparent">Mitglied</span>
    </div>
  );
}
