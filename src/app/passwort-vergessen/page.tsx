import Link from "next/link";
import { Card, Screen } from "@/components/ui";
import { ResetForm } from "./ResetForm";

export const metadata = { title: "Passwort vergessen" };

export default function ForgotPasswordPage() {
  return (
    <Screen
      title="Passwort vergessen"
      lead="Wir schicken dir einen Link, mit dem du ein neues setzen kannst."
    >
      <Card>
        <ResetForm />
      </Card>
      <p className="text-center text-[15px]">
        <Link href="/anmelden" className="text-muted underline underline-offset-4">
          Zurück zur Anmeldung
        </Link>
      </p>
    </Screen>
  );
}
