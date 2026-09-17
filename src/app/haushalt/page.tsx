import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getServerSupabase } from "@/lib/server/supabase";
import { listHouseholds, listMembers, listOpenInvites } from "@/lib/data/households";
import { Card, Notice, Screen } from "@/components/ui";
import { InviteSection } from "./InviteSection";

export const metadata = { title: "Haushalt" };

export default async function HouseholdPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  const supabase = await getServerSupabase();
  if (!supabase) redirect("/anmelden");

  const households = await listHouseholds(supabase);
  if (!households.ok) {
    return (
      <Screen title="Haushalt">
        <Notice tone="error">{households.error}</Notice>
      </Screen>
    );
  }
  if (households.value.length === 0) redirect("/haushalt/start");

  const household = households.value[0];
  const [members, invites] = await Promise.all([
    listMembers(supabase, household.id),
    listOpenInvites(supabase, household.id),
  ]);

  return (
    <Screen title={household.name}>
      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Mitglieder
        </h2>
        {members.ok ? (
          <ul className="mt-3 space-y-2 text-[15px]">
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
        ) : (
          <p className="mt-3 text-[15px] text-muted">{members.error}</p>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Einladen
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          Ein Code gilt 14 Tage und lässt sich einmal einlösen.
        </p>
        <div className="mt-4">
          <InviteSection
            householdId={household.id}
            invites={invites.ok ? invites.value : []}
          />
        </div>
      </Card>

      <p className="text-center text-[15px]">
        <Link href="/" className="text-muted underline underline-offset-4">
          Zurück
        </Link>
      </p>
    </Screen>
  );
}
