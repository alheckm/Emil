import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/supabase";
import { Card, Screen } from "@/components/ui";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Konto anlegen" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <Screen
      title="Konto anlegen"
      lead="Danach legst du einen Haushalt an oder trittst mit einem Code einem bestehenden bei."
    >
      <Card>
        <RegisterForm />
      </Card>
      <p className="text-center text-[15px]">
        <Link href="/anmelden" className="text-muted underline underline-offset-4">
          Ich habe schon ein Konto
        </Link>
      </p>
    </Screen>
  );
}
