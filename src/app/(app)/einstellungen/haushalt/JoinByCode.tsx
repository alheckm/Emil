"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemAndSwitchHousehold } from "@/lib/server/householdActions";
import { Button, Field, Notice } from "@/components/ui";

/**
 * Einen Code einlösen, den man mündlich oder per SMS bekommen hat — ohne den
 * aktuellen Haushalt vorher zu verlassen. Der Gegenpart zum Link
 * (/beitreten/[code]): der landet automatisch hier, ein zugerufener Code
 * braucht dagegen ein Feld zum Abtippen.
 *
 * `redeemAndSwitchHousehold()` (Server Action, householdActions.ts) löst den
 * Code ein UND setzt den neuen Haushalt explizit als aktiven
 * (0026_aktiver_haushalt.sql) — beides zusammen, weil nur eine Server Action
 * `loadHousehold()`s Zwischenspeicher per `updateTag()` sofort veralten
 * lassen kann. `router.refresh()` genügt danach, weil
 * `/einstellungen/haushalt` selbst schon die richtige Seite ist: Titel und
 * „Deine Haushalte" holen sich mit dem Refresh den neuen Stand.
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

    const result = await redeemAndSwitchHousehold(code);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
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
