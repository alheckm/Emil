"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { setNewPassword } from "@/lib/data/auth";
import { Button, Field, Notice } from "@/components/ui";

export function NewPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const repeat = String(form.get("repeat") ?? "");
    setError("");

    if (password.length < 8) {
      setError("Das Passwort braucht mindestens acht Zeichen.");
      return;
    }
    if (password !== repeat) {
      setError("Die beiden Eingaben sind nicht gleich.");
      return;
    }

    setBusy(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setBusy(false);
      return;
    }

    const result = await setNewPassword(supabase, password);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

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
        label="Neues Passwort"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="Mindestens acht Zeichen."
      />
      <Field
        label="Noch einmal"
        name="repeat"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Button type="submit" disabled={busy} loading={busy}>
        {busy ? "Einen Moment …" : "Passwort speichern"}
      </Button>
    </form>
  );
}
