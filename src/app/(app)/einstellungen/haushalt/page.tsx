import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { requireHousehold } from "@/lib/server/household";
import { listHouseholds, listMembersWithProfiles, listOpenInvites } from "@/lib/data/households";
import { Avatar, Section, Notice, Screen, ScreenHeader, SectionEyebrow } from "@/components/ui";
import { HeaderSkeleton, RowsSkeleton } from "@/components/skeletons";
import { InviteSection } from "./InviteSection";
import { JoinByCode } from "./JoinByCode";
import { HouseholdsList } from "./HouseholdsList";

export const metadata = { title: "Haushalt" };

/**
 * Haushalt und Einladungen.
 *
 * Der Titel ist der Haushaltsname und kommt damit aus den Daten — er steht
 * deshalb in einer eigenen Grenze und nicht im statischen Rahmen. Mitglieder
 * und Einladungen sind zwei unabhängige Abfragen und bekommen je eine eigene
 * Grenze: die Einladungen sind seltener interessant und dürfen die
 * Mitgliederliste nicht aufhalten.
 */
export default function HouseholdPage() {
  return (
    <Screen>
      <Suspense fallback={<HeaderSkeleton />}>
        <Title />
      </Suspense>

      <Section>
        <SectionEyebrow>Mitglieder</SectionEyebrow>
        <div className="mt-3">
          <Suspense fallback={<RowsSkeleton rows={2} />}>
            <Members />
          </Suspense>
        </div>
      </Section>

      <Section>
        <SectionEyebrow>Einladen</SectionEyebrow>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          Ein Code gilt 14 Tage und lässt sich einmal einlösen — geteilt als
          Link, muss er nicht abgetippt werden.
        </p>
        <div className="mt-4">
          <Suspense fallback={<RowsSkeleton rows={1} />}>
            <Invites />
          </Suspense>
        </div>
      </Section>

      <Section>
        <SectionEyebrow>Beitreten</SectionEyebrow>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          Selbst einen Code bekommen? Hier eintragen — der neue Haushalt wird
          der aktive, dein bisheriger bleibt bestehen. Im Konto kannst du
          jederzeit zwischen ihnen wechseln.
        </p>
        <div className="mt-4">
          <JoinByCode />
        </div>
      </Section>

      <Suspense fallback={null}>
        <Households />
      </Suspense>
    </Screen>
  );
}

async function Title() {
  const context = await requireHousehold();
  if (!context.ok) return <ScreenHeader title="Haushalt" />;
  return <ScreenHeader title={context.household.name} />;
}

async function Members() {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const context = await requireHousehold();
  if (!context.ok) return <Notice tone="error">{context.error}</Notice>;

  const members = await listMembersWithProfiles(context.supabase, context.household.id);
  if (!members.ok) {
    return <p className="text-[15px] text-muted">{members.error}</p>;
  }

  return (
    <ul className="space-y-3 text-[15px]">
      {members.value.map((member) => {
        const isSelf = member.userId === user.id;
        const name = member.displayName || (isSelf ? "Du" : "Mitbewohner:in");
        return (
          <li key={member.userId} className="flex items-center gap-3">
            <Avatar
              url={member.avatarUrl}
              initial={name.charAt(0).toUpperCase()}
              size={36}
            />
            <span className="min-w-0 flex-1 truncate">
              {member.displayName && isSelf ? `${name} · Du` : name}
            </span>
            <span className="shrink-0 text-[13px] text-muted">
              {member.role === "owner" ? "Eigentümer:in" : "Mitglied"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

async function Invites() {
  const context = await requireHousehold();
  if (!context.ok) return <Notice tone="error">{context.error}</Notice>;

  const invites = await listOpenInvites(context.supabase, context.household.id);

  return (
    <InviteSection
      householdId={context.household.id}
      invites={invites.ok ? invites.value : []}
    />
  );
}

/**
 * Nur sichtbar, wenn mehr als ein Haushalt besteht. Welcher davon gerade der
 * aktive ist, wählt der Wechsler im Konto-Tab (`HouseholdSwitcher.tsx`,
 * 0026_aktiver_haushalt.sql); hier geht es nur ums endgültige Verlassen.
 * Sonst bliebe hier eine Überschrift ohne Inhalt stehen, deshalb kein
 * eigener Suspense-Fallback: bei einem Haushalt erscheint der ganze
 * Abschnitt einfach nie.
 */
async function Households() {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const context = await requireHousehold();
  if (!context.ok) return null;

  const households = await listHouseholds(context.supabase, user.id);
  if (!households.ok || households.value.length <= 1) return null;

  return (
    <Section>
      <SectionEyebrow>Deine Haushalte</SectionEyebrow>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">
        „{context.household.name}“ ist gerade aktiv — wechseln geht im
        Konto-Tab. Brauchst du einen der anderen nicht mehr, verlasse ihn
        hier.
      </p>
      <div className="mt-4">
        <HouseholdsList
          households={households.value}
          activeId={context.household.id}
        />
      </div>
    </Section>
  );
}
