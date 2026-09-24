"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { signOut } from "@/lib/data/auth";
import { Button, Notice } from "@/components/ui";

/**
 * Abmelden — als Umriss-Pille auf dem Konto-Hub (DESIGN.md „Konto").
 *
 * Eigene Datei statt Teil von `AccountActions.tsx` (aufgeteilt 2026-09-24):
 * Abmelden gehört auf den Hub, Löschen auf eine eigene Unterseite — beides
 * teilte sich vorher nur ein Formular, obwohl es zwei getrennte Bildschirme
 * sind.
 */
export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setError("");
    setBusy(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setBusy(false);
      return;
    }
    const result = await signOut(supabase);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.refresh();
    router.replace("/anmelden");
  }

  return (
    <div className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}
      <Button
        variant="secondary"
        disabled={busy}
        loading={busy}
        onClick={() => void onSignOut()}
      >
        {busy ? "Einen Moment" : "Abmelden"}
      </Button>
    </div>
  );
}
