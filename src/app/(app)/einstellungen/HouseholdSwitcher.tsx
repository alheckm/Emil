"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Household } from "@/lib/data/households";
import { createAndSwitchHousehold, switchActiveHousehold } from "@/lib/server/householdActions";
import { Avatar, Button, Field, Notice, SettingsRowButton } from "@/components/ui";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";

/**
 * Haushalt wechseln (DESIGN.md „Konto"): ein natives Bottom-Sheet über dem
 * Konto-Hub, wie der Konto-Wechsler bei Instagram — passend dazu, dass
 * Rezepte, Einkaufsliste und Aufgaben am Haushalt hängen, nicht an der
 * Person (0026_aktiver_haushalt.sql). Verlassen bleibt drüben auf
 * `/einstellungen/haushalt`; hier geht es nur ums Wechseln, Beitreten und
 * Anlegen.
 *
 * „Neuen Haushalt anlegen" läuft hier inline statt über `/haushalt/start`:
 * die Seite leitet jeden mit bestehendem Haushalt sofort weiter (Absicht,
 * siehe dort) — genau die Zielgruppe dieses Wechslers.
 *
 * Wechseln und Anlegen laufen über Server Actions (householdActions.ts),
 * nicht über den Browser-Client: nur dort lässt sich `loadHousehold()`s
 * Zwischenspeicher per `updateTag()` sofort veralten, siehe die
 * Begründung dort.
 */
export function HouseholdSwitcher({
  households,
  activeId,
}: {
  households: Household[];
  activeId: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<"list" | "create">("list");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = households.find((household) => household.id === activeId);

  function open() {
    setView("list");
    setName("");
    setError("");
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  async function selectHousehold(householdId: string) {
    if (householdId === activeId) {
      close();
      return;
    }
    setError("");
    setBusyId(householdId);
    const result = await switchActiveHousehold(householdId);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    close();
    router.refresh();
  }

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusyId("create");
    const created = await createAndSwitchHousehold(name);
    setBusyId(null);
    if (!created.ok) {
      setError(created.error);
      return;
    }
    close();
    router.refresh();
  }

  return (
    <>
      <SettingsRowButton
        onClick={open}
        trailing={<ChevronDownIcon aria-hidden className="h-4 w-4 text-inactive" />}
        aria-haspopup="dialog"
      >
        <span className="font-display text-[15px] font-bold text-text">
          {active?.name ?? "Haushalt"}
        </span>
      </SettingsRowButton>

      {/* Klick auf den Bereich außerhalb der Sheet-Karte trägt hier
          `target === dialog` (Browser-Verhalten bei <dialog>::backdrop);
          Tastatur schließt weiterhin per Esc. */}
      <dialog
        ref={dialogRef}
        className="sheet"
        aria-label="Haushalt wechseln"
        onClose={() => setView("list")}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="max-h-[80vh] overflow-y-auto px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <div
            aria-hidden
            className="mx-auto mb-4 h-1 w-9 rounded-pill bg-border"
          />

          {view === "list" ? (
            <>
              <h2 className="font-display text-[17px] font-bold text-text">
                Haushalt wechseln
              </h2>

              <div className="mt-3 space-y-1">
                {error && <Notice tone="error">{error}</Notice>}
                {households.map((household) => (
                  <button
                    key={household.id}
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void selectHousehold(household.id)}
                    className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left press-flat tap-target disabled:opacity-50"
                  >
                    <Avatar
                      initial={household.name.trim().charAt(0).toUpperCase()}
                      size={36}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-text">
                        {household.name}
                      </span>
                      <span className="block text-[12.5px] text-muted">
                        {household.role === "owner" ? "Eigentümer:in" : "Mitglied"}
                      </span>
                    </span>
                    {household.id === activeId && (
                      <CheckIcon aria-hidden className="h-5 w-5 shrink-0 text-accent" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-2 border-t border-border pt-1">
                <SettingsRowButton
                  onClick={() => {
                    setView("create");
                    setError("");
                  }}
                >
                  Neuen Haushalt anlegen
                </SettingsRowButton>
                <Link
                  href="/einstellungen/haushalt"
                  onClick={close}
                  className="flex min-h-[52px] items-center text-[15px] text-text press-flat tap-target"
                >
                  Haushalt beitreten
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-[17px] font-bold text-text">
                Neuen Haushalt anlegen
              </h2>
              <form className="mt-4 space-y-4" onSubmit={(event) => void onCreate(event)}>
                {error && <Notice tone="error">{error}</Notice>}
                <Field
                  label="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={60}
                  placeholder="Zuhause"
                  autoComplete="off"
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button type="submit" disabled={busyId !== null} loading={busyId === "create"}>
                    {busyId === "create" ? "Einen Moment" : "Anlegen"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busyId !== null}
                    onClick={() => setView("list")}
                  >
                    Zurück
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
