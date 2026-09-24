"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { signOut } from "@/lib/data/auth";
import { Button, Field, Notice } from "@/components/ui";

/**
 * Konto löschen — eigener Screen statt Karte im Konto-Hub (DESIGN.md
 * „Konto"), damit die Gefahrenzone nicht neben Abmelden und Namensfeld
 * gleichrangig herumsteht.
 *
 * Verlangt weiterhin, „LÖSCHEN" zu tippen, statt einen Bestätigungsdialog zu
 * zeigen: `confirm()` ist im Standalone-Modus auf dem iPhone ein blockierendes
 * Systemfenster, das man wegwischt, ohne es zu lesen. Etwas abzutippen kann
 * man nicht aus Versehen.
 */
export function DeleteAccount() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function onDelete() {
    setError("");
    setBusy(true);

    // Über die HTTP-Route, nicht über den Browser-Client: den Eintrag in
    // auth.users kann nur der Server mit dem Service-Key entfernen.
    const response = await fetch("/api/v1/account", { method: "DELETE" });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setError(body?.error ?? "Das Konto konnte nicht gelöscht werden.");
      setBusy(false);
      return;
    }

    // Das Abmelden im Browser löscht die lokale Kopie der Sitzung; der Server
    // hat seine schon verworfen.
    const supabase = getBrowserSupabase();
    if (supabase) await signOut(supabase);

    router.refresh();
    router.replace("/anmelden");
  }

  return (
    <div className="space-y-5">
      {error && <Notice tone="error">{error}</Notice>}

      <p className="text-[15px] leading-relaxed text-muted">
        Entfernt dein Konto und deine Mitgliedschaft. Bist du die letzte
        Person im Haushalt, verschwindet er mitsamt Rezepten, Einkaufslisten
        und Bildern. Das lässt sich nicht rückgängig machen.
      </p>
      <Field
        label="Zum Bestätigen LÖSCHEN eingeben"
        value={confirmText}
        onChange={(event) => setConfirmText(event.target.value)}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
      />
      <Button
        variant="danger"
        disabled={busy || confirmText.trim().toUpperCase() !== "LÖSCHEN"}
        loading={busy}
        onClick={() => void onDelete()}
      >
        {busy ? "Wird gelöscht" : "Konto endgültig löschen"}
      </Button>
    </div>
  );
}
