"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { signOut } from "@/lib/data/auth";
import { Button, Field, Notice } from "@/components/ui";

/**
 * Abmelden und Konto löschen.
 *
 * Das Löschen verlangt, „LÖSCHEN" zu tippen, statt einen Bestätigungsdialog zu
 * zeigen: `confirm()` ist im Standalone-Modus auf dem iPhone ein blockierendes
 * Systemfenster, das man wegwischt, ohne es zu lesen. Etwas abzutippen kann
 * man nicht aus Versehen.
 */
export function AccountActions() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"out" | "delete" | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function onSignOut() {
    setError("");
    setBusy("out");
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setBusy(null);
      return;
    }
    const result = await signOut(supabase);
    if (!result.ok) {
      setError(result.error);
      setBusy(null);
      return;
    }
    router.refresh();
    router.replace("/anmelden");
  }

  async function onDelete() {
    setError("");
    setBusy("delete");

    // Über die HTTP-Route, nicht über den Browser-Client: den Eintrag in
    // auth.users kann nur der Server mit dem Service-Key entfernen.
    const response = await fetch("/api/v1/account", { method: "DELETE" });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setError(body?.error ?? "Das Konto konnte nicht gelöscht werden.");
      setBusy(null);
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
    <div className="space-y-6">
      {error && <Notice tone="error">{error}</Notice>}

      <Button
        variant="secondary"
        disabled={busy !== null}
        loading={busy === "out"}
        onClick={() => void onSignOut()}
      >
        {busy === "out" ? "Einen Moment" : "Abmelden"}
      </Button>

      <div className="space-y-3 border border-border p-5">
        <h2 className="text-[13px] font-extrabold tracking-[0.1em] text-danger uppercase">
          Konto löschen
        </h2>
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
          disabled={busy !== null || confirmText.trim().toUpperCase() !== "LÖSCHEN"}
          loading={busy === "delete"}
          onClick={() => void onDelete()}
        >
          {busy === "delete" ? "Wird gelöscht" : "Konto endgültig löschen"}
        </Button>
      </div>
    </div>
  );
}
