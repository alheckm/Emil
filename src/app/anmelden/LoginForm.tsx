"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { signIn } from "@/lib/data/auth";
import { Button, Field, Notice } from "@/components/ui";

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setBusy(true);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setBusy(false);
      return;
    }

    const result = await signIn(
      supabase,
      String(form.get("email") ?? ""),
      String(form.get("password") ?? ""),
    );

    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

    // `refresh()` vor `replace()`: sonst zeigt der Server-Cache der Startseite
    // noch den abgemeldeten Zustand, und man landet direkt wieder hier.
    router.refresh();
    router.replace("/");
  }

  // method="post": läuft das JavaScript nicht, schickt der Browser das
  // Formular von sich aus ab — ohne method als GET, mit Passwort und Code in
  // der Adresszeile und damit im Serverlog und im Verlauf des Geräts. So wird
  // aus dem Leck ein harmloser 405.
  return (
    <form method="post" onSubmit={onSubmit} className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <Field
        label="E-Mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        required
      />
      <Field
        label="Passwort"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" disabled={busy} loading={busy}>
        {busy ? "Einen Moment …" : "Anmelden"}
      </Button>
    </form>
  );
}
