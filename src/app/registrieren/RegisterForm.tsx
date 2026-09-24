"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { signUp } from "@/lib/data/auth";
import { Button, Field, Notice } from "@/components/ui";

export function RegisterForm({
  next,
}: {
  /** Ziel nach der Bestätigungsmail — etwa zurück zu einer Einladung. */
  next?: string;
} = {}) {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    setError("");

    // Vor dem Absenden prüfen, was ohne Netz zu prüfen ist — sonst wartet man
    // auf eine Antwort, um dann zu erfahren, dass das Passwort zu kurz war.
    if (password.length < 8) {
      setError("Das Passwort braucht mindestens acht Zeichen. Ein ganzer Satz ist ideal.");
      return;
    }

    setBusy(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setBusy(false);
      return;
    }

    const redirectTo = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;

    const result = await signUp(
      supabase,
      String(form.get("email") ?? ""),
      password,
      redirectTo,
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
        Fast geschafft. Wir haben dir eine E-Mail geschickt — öffne den Link
        darin <strong>auf diesem Gerät</strong>, dann bist du angemeldet
        {next ? " und trittst dem Haushalt bei" : ""}.
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
      <Field
        label="Passwort"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="Mindestens acht Zeichen."
      />
      <Button type="submit" disabled={busy} loading={busy}>
        {busy ? "Einen Moment …" : "Konto anlegen"}
      </Button>
    </form>
  );
}
