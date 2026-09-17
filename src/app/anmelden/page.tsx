import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { Card, Screen } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { fehler } = await searchParams;

  return (
    <Screen title="Emil" lead="Rezepte, Portionen, Einkaufsliste — geteilt im Haushalt.">
      <Card>
        <LoginForm initialError={fehler} />
      </Card>

      <div className="space-y-2 text-center text-[15px]">
        <p>
          <Link href="/registrieren" className="text-accent underline underline-offset-4">
            Neu hier? Konto anlegen
          </Link>
        </p>
        <p>
          <Link
            href="/passwort-vergessen"
            className="text-muted underline underline-offset-4"
          >
            Passwort vergessen
          </Link>
        </p>
      </div>
    </Screen>
  );
}
