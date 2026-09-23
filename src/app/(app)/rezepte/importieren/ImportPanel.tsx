"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { parsePastedRecipe } from "@/lib/core/parsePastedRecipe";
import { IMPORT_PROMPT, IMPORT_PROMPT_HINT } from "@/lib/core/importPrompt";
import { Button, Section, Field, Notice, Textarea } from "@/components/ui";
import { RecipeForm, type ImportDraft } from "../RecipeForm";

/**
 * Rezepte importieren — Webseite oder Einfügen.
 *
 * Beide Wege enden im selben Prüf-Screen (RecipeForm), und keiner speichert
 * von sich aus. Der Grund steht im Plan: weder Parser noch eingefügter Text
 * sind fehlerfrei, und ein Rezept mit falschen Mengen ist schlimmer als eines,
 * das man tippt.
 */

type Tab = "web" | "einfuegen";

export function ImportPanel({
  householdId,
  prefillUrl = null,
}: {
  householdId: string;
  /** Aus `?url=` — der Weg, den der iOS-Kurzbefehl nimmt. */
  prefillUrl?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("web");
  const [draft, setDraft] = useState<ImportDraft | null>(null);

  const [url, setUrl] = useState(prefillUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hint, setHint] = useState("");

  const [pasted, setPasted] = useState("");
  const [copied, setCopied] = useState(false);

  // Kommt die Adresse aus dem iOS-Kurzbefehl, soll kein weiterer Knopfdruck
  // nötig sein — geteilt ist geteilt. Ein Merker statt Zustand, weil das kein
  // erneutes Rendern auslösen muss; und vor jedem bedingten return, weil Hooks
  // in jeder Runde in derselben Reihenfolge laufen müssen.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!prefillUrl || autoStarted.current) return;
    autoStarted.current = true;
    void importFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillUrl]);

  // Ist ein Entwurf da, zählt nur noch das Prüfen. Der Import tritt zurück,
  // damit niemand versehentlich zweimal importiert und den Entwurf verliert.
  if (draft) {
    return (
      <div className="space-y-6">
        <Notice tone="ok">
          {draft.sourceType === "url"
            ? "Rezept von der Webseite gelesen."
            : "Rezept aus dem eingefügten Text gelesen."}{" "}
          Bitte durchsehen — besonders die farbig markierten Zeilen — und dann
          speichern.
        </Notice>
        {/* Der Hinweis gehört genau hierher: er warnt vor einem Weg, der mehr
            geraten hat als üblich, und muss deshalb beim Prüfen sichtbar sein
            und nicht auf dem Bildschirm davor. */}
        {hint && <Notice tone="info">{hint}</Notice>}
        <p className="text-[15px]">
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setHint("");
            }}
            className="text-muted underline underline-offset-4"
          >
            Verwerfen und anders importieren
          </button>
        </p>
        <RecipeForm householdId={householdId} draft={draft} />
      </div>
    );
  }

  // Kommt die Adresse aus dem Kurzbefehl, soll nicht noch ein Knopfdruck
  // nötig sein — geteilt ist geteilt. Läuft genau einmal.
  async function importFromUrl() {
    setErrors([]);
    setHint("");
    if (!url.trim()) {
      setErrors(["Bitte die Adresse des Rezepts einfügen."]);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/v1/import/url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setErrors([payload?.error ?? "Der Import ist fehlgeschlagen."]);
        return;
      }

      setDraft({
        title: payload.recipe.title,
        servings: payload.recipe.servings,
        servingsLabel: payload.recipe.servingsLabel,
        totalTimeMin: payload.recipe.totalTimeMin ?? null,
        ingredients: payload.recipe.ingredients,
        instructions: payload.recipe.instructions,
        sourceType: "url",
        sourceUrl: payload.sourceUrl ?? url.trim(),
      });

      if (payload.source === "microdata") {
        setHint(
          "Diese Seite liefert keine sauber ausgezeichneten Rezeptdaten; " +
            "gelesen wurde ein Notfallweg. Bitte besonders genau prüfen.",
        );
      }
    } catch {
      setErrors(["Der Server war nicht erreichbar. Nochmal versuchen?"]);
    } finally {
      setBusy(false);
    }
  }

  function importFromPaste() {
    setErrors([]);
    setHint("");

    const result = parsePastedRecipe(pasted);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setDraft({
      ...result.recipe,
      totalTimeMin: null,
      sourceType: "paste",
      sourceUrl: null,
    });
    if (result.via === "text") {
      setHint(
        "Aus freiem Text gelesen — dabei rät Emil mehr als beim JSON-Weg. " +
          "Bitte Mengen und Einheiten durchsehen.",
      );
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(IMPORT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      setErrors([
        "Das Kopieren hat der Browser abgelehnt. Du kannst den Prompt unten " +
          "auch von Hand markieren.",
      ]);
    }
  }

  return (
    <div className="space-y-6">
      <div role="tablist" className="flex gap-2">
        <TabButton active={tab === "web"} onClick={() => setTab("web")}>
          Webseite
        </TabButton>
        <TabButton
          active={tab === "einfuegen"}
          onClick={() => setTab("einfuegen")}
        >
          Einfügen
        </TabButton>
      </div>

      {errors.length > 0 && (
        <Notice tone="error">
          {errors.length === 1 ? (
            errors[0]
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </Notice>
      )}
      {hint && <Notice tone="info">{hint}</Notice>}

      {tab === "web" ? (
        <Section>
          <div className="space-y-4">
            <Field
              label="Adresse des Rezepts"
              hint="Funktioniert bei Chefkoch und den meisten deutschen Rezeptseiten."
              type="url"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="https://www.chefkoch.de/rezepte/…"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
            <Button onClick={importFromUrl} disabled={busy} loading={busy}>
              {busy ? "Wird gelesen" : "Rezept holen"}
            </Button>
          </div>
        </Section>
      ) : (
        <Section>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[15px] leading-relaxed">
                Für Kochbuch-Fotos und Screenshots aus anderen Apps:{" "}
                {IMPORT_PROMPT_HINT}
              </p>
              <Button variant="secondary" onClick={copyPrompt}>
                {copied ? "Prompt kopiert ✓" : "Prompt kopieren"}
              </Button>
            </div>
            <Textarea
              label="Rezept einfügen"
              hint="JSON aus claude.ai — oder einfach den Rezepttext."
              rows={10}
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
            />
            <Button onClick={importFromPaste}>Rezept übernehmen</Button>
          </div>
        </Section>
      )}

      <p className="text-center text-[15px]">
        <Link
          href="/rezepte/neu"
          className="text-muted underline underline-offset-4"
        >
          Lieber von Hand eingeben
        </Link>
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        // Reine Auswahl-Markierung, kein Fehler: dieselbe Fläche wie die
        // aktive Schlagwort-Pille in RecipeBrowser.tsx, nicht `--accent` (das
        // ist jetzt die Markenfarbe für Aktionen, keine allgemeine
        // Hervorhebung) und nicht `--danger` (kein Fehlerzustand).
        "min-h-11 flex-1 border px-4 text-[12px] font-bold tracking-[0.06em] uppercase " +
        (active
          ? "border-text bg-text text-card"
          : "border-border text-muted")
      }
    >
      {children}
    </button>
  );
}
