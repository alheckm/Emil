"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { leaveHousehold, type Household } from "@/lib/data/households";
import { Button, Field, Notice } from "@/components/ui";

/**
 * Nur sichtbar, wenn jemand mehr als einem Haushalt angehört — der Normalfall
 * bei einer Einladung, der einem schon bestehenden Haushalt folgt (siehe
 * /beitreten/[code]). Das Abtippen von „VERLASSEN" statt eines Systemdialogs
 * folgt demselben Muster wie „Konto löschen" (AccountActions.tsx): `confirm()`
 * ist im Standalone-Modus ein blockierendes Systemfenster, das man wegwischt,
 * ohne es zu lesen.
 */
export function HouseholdsList({
  households,
  activeId,
}: {
  households: Household[];
  /** Der Haushalt, den Rezepte/Liste/Aufgaben gerade zeigen (requireHousehold()). */
  activeId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  async function leave(id: string) {
    setError("");
    setBusy(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setBusy(false);
      return;
    }
    const result = await leaveHousehold(supabase, id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(null);
    setConfirmText("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}

      <ul className="space-y-3">
        {households.map((household) => (
          <li key={household.id} className="rounded-card bg-soft p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-text">
                  {household.name}
                </p>
                <p className="text-[13px] text-muted">
                  {household.role === "owner" ? "Eigentümer:in" : "Mitglied"}
                  {household.id === activeId && " · wird gerade angezeigt"}
                </p>
              </div>
              {open !== household.id && (
                <Button
                  type="button"
                  variant="tertiary"
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    setConfirmText("");
                    setOpen(household.id);
                  }}
                >
                  Verlassen
                </Button>
              )}
            </div>

            {open === household.id && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <p className="text-[13px] leading-relaxed text-muted">
                  Entfernt deine Mitgliedschaft in „{household.name}“. Bist du
                  die letzte Person darin, verschwindet er mitsamt Rezepten,
                  Einkaufsliste und Aufgaben — das lässt sich nicht rückgängig
                  machen.
                </p>
                <Field
                  label="Zum Bestätigen VERLASSEN eingeben"
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="danger"
                    disabled={
                      busy || confirmText.trim().toUpperCase() !== "VERLASSEN"
                    }
                    loading={busy}
                    onClick={() => void leave(household.id)}
                  >
                    {busy ? "Einen Moment" : "Haushalt verlassen"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setOpen(null)}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
