"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { requestPasswordReset } from "@/lib/data/auth";
import { Button, Field, Notice } from "@/components/ui";

export function ResetForm() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
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

    const result = await requestPasswordReset(
      supabase,
      String(form.get("email") ?? ""),
      `${window.location.origin}/auth/callback?next=/passwort-neu`,
    );

    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Notice tone="ok">
        Wenn es zu dieser Adresse ein Konto gibt, liegt gleich eine E-Mail im
        Postfach. Öffne den Link darin auf diesem Gerät.
      </Notice>
    );
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
      <Button type="submit" disabled={busy} loading={busy}>
        {busy ? "Einen Moment …" : "Link schicken"}
      </Button>
    </form>
  );
}
