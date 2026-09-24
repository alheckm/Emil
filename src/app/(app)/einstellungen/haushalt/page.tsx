import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { requireHousehold } from "@/lib/server/household";
import { listHouseholds, listMembers, listOpenInvites } from "@/lib/data/households";
import { Section, Notice, Screen, ScreenHeader } from "@/components/ui";
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

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Beitreten
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          Selbst einen Code bekommen? Hier eintragen — der aktuelle Haushalt
          bleibt bestehen, du kannst ihn danach unten verlassen.
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

/**
 * Nur sichtbar, wenn mehr als ein Haushalt besteht — der Normalfall, wenn
 * jemand einer Einladung gefolgt ist, ohne vorher den alten Haushalt zu
 * verlassen (siehe /beitreten/[code]). Sonst bliebe hier eine Überschrift
 * ohne Inhalt stehen, deshalb kein eigener Suspense-Fallback: bei einem
 * Haushalt erscheint der ganze Abschnitt einfach nie.
 */
async function Households() {
  const context = await requireHousehold();
  if (!context.ok) return null;

  const households = await listHouseholds(context.supabase);
  if (!households.ok || households.value.length <= 1) return null;

  return (
    <Section>
      <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
        Deine Haushalte
      </h2>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">
        emil zeigt oben Rezepte und Einkaufsliste aus „{context.household.name}
        “. Brauchst du einen der anderen nicht mehr, verlasse ihn hier.
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
