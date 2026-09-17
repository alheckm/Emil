import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { Card, Screen } from "@/components/ui";
import { AccountActions } from "./AccountActions";

export const metadata = { title: "Konto" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");

  return (
    <Screen title="Konto">
      <Card>
        <dl className="space-y-2 text-[15px]">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">E-Mail</dt>
            <dd className="truncate font-medium">{user.email}</dd>
          </div>
        </dl>
      </Card>

      <AccountActions />

      <p className="text-center text-[15px]">
        <Link href="/" className="text-muted underline underline-offset-4">
          Zurück
        </Link>
      </p>
    </Screen>
  );
}
