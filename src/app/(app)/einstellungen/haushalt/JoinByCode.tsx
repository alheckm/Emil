"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { redeemInvite } from "@/lib/data/households";
import { setActiveHousehold } from "@/lib/data/profiles";
import { Button, Field, Notice } from "@/components/ui";

/**
 * Einen Code einlösen, den man mündlich oder per SMS bekommen hat — ohne den
 * aktuellen Haushalt vorher zu verlassen. Der Gegenpart zum Link
 * (/beitreten/[code]): der landet automatisch hier, ein zugerufener Code
 * braucht dagegen ein Feld zum Abtippen.
 *
 * Der neu beigetretene Haushalt wird danach explizit der aktive
 * (`setActiveHousehold()`, 0026_aktiver_haushalt.sql) — `router.refresh()`
 * genügt danach, weil `/einstellungen/haushalt` selbst schon die richtige
 * Seite ist: Titel und „Deine Haushalte" holen sich mit dem Refresh den
 * neuen Stand.
 */
export function JoinByCode() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = String(new FormData(form).get("code") ?? "");
    setError("");
    setBusy(true);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setBusy(false);
      return;
    }

    const result = await redeemInvite(supabase, code);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (data.user) await setActiveHousehold(supabase, data.user.id, result.value);

    setBusy(false);
    form.reset();
    router.refresh();
  }

  // method="post": läuft das JavaScript nicht, schickt der Browser das
  // Formular von sich aus ab — ohne method als GET, mit dem Code in der
  // Adresszeile und damit im Serverlog und im Verlauf des Geräts.
  return (
    <form method="post" className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field
        label="Einladungscode"
        name="code"
        required
        maxLength={12}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        placeholder="ABCD2345"
        className="font-mono"
      />
      <Button type="submit" variant="secondary" disabled={busy} loading={busy}>
        {busy ? "Einen Moment" : "Beitreten"}
      </Button>
    </form>
  );
}
