import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { requireHousehold } from "@/lib/server/household";
import { listMembers, listOpenInvites } from "@/lib/data/households";
import { Section, Notice, Screen, ScreenHeader } from "@/components/ui";
import { HeaderSkeleton, RowsSkeleton } from "@/components/skeletons";
import { InviteSection } from "./InviteSection";

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
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Mitglieder
        </h2>
        <div className="mt-3">
          <Suspense fallback={<RowsSkeleton rows={2} />}>
            <Members />
          </Suspense>
        </div>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Einladen
        </h2>
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

  const members = await listMembers(context.supabase, context.household.id);
  if (!members.ok) {
    return <p className="text-[15px] text-muted">{members.error}</p>;
  }

  return (
    <ul className="space-y-2 text-[15px]">
      {members.value.map((member) => (
        <li
          key={member.userId}
          className="flex items-center justify-between gap-4"
        >
          {/* Namen gibt es hier bewusst nicht: auth.users ist für die App
              nicht lesbar, und eine zweite Kopie der E-Mail-Adresse in
              einer eigenen Tabelle wäre mehr Datenhaltung als Nutzen. */}
          <span>{member.userId === user.id ? "Du" : "Mitbewohner:in"}</span>
          <span className="text-[13px] text-muted">
            {member.role === "owner" ? "Eigentümer:in" : "Mitglied"}
          </span>
        </li>
      ))}
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
