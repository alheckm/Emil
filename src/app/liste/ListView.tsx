"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatAmount } from "@/lib/core/format";
import { parseAmount } from "@/lib/core/numbers";
import { mergeUnitFor, UNITS } from "@/lib/core/units";
import { toMergeAmount } from "@/lib/core/mergeList";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { subscribeToList } from "@/lib/client/realtime";
import { applyPendingToggles } from "@/lib/core/pendingToggles";
import { loadSnapshot, saveSnapshot } from "@/lib/client/offline/db";
import { flushOutbox, pendingToggles, rememberToggle } from "@/lib/client/offline/outbox";
import { useOnlineStatus } from "@/lib/client/offline/useOnlineStatus";
import {
  addManualEntry,
  deleteEntry,
  setEntryChecked,
  setIngredientCategory,
  type Category,
  type ListEntry,
} from "@/lib/data/shoppingList";
import { Card, Notice } from "@/components/ui";

/**
 * Die Einkaufsliste, wie sie im Supermarkt benutzt wird.
 *
 * Drei Entscheidungen, die aus genau dieser Situation kommen:
 *
 * - **Antippen hakt ab.** Die ganze Zeile ist die Trefferfläche, nicht ein
 *   kleines Kästchen — die App wird einhändig und in Bewegung bedient.
 * - **Abgehaktes bleibt stehen.** Zeilen nach unten wandern zu lassen sieht
 *   aufgeräumt aus, verschiebt aber im selben Moment die Zeile darunter unter
 *   den Daumen, der schon unterwegs ist.
 * - **Das Häkchen wirkt sofort**, auch bevor der Server geantwortet hat. Geht
 *   es schief, springt es zurück und die Meldung erklärt warum.
 */
export function ListView({
  householdId,
  listId,
  entries,
  categories,
}: {
  householdId: string;
  listId: string;
  entries: ListEntry[];
  categories: Category[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [checkedNow, setCheckedNow] = useState<Record<string, boolean>>({});

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unitCode, setUnitCode] = useState("");

  // Neue Daten vom Server: die eigenen, vorgezogenen Häkchen sind darin
  // enthalten und werden hier wieder fallen gelassen. Das passiert beim
  // Rendern und nicht in einem Effekt — sonst zeigte die Liste für einen
  // Durchgang den alten Stand über den neuen Daten.
  const [shownEntries, setShownEntries] = useState(entries);
  if (shownEntries !== entries) {
    setShownEntries(entries);
    setCheckedNow({});
  }

  const online = useOnlineStatus();
  // Häkchen, die noch nicht beim Server angekommen sind. Sie werden über den
  // Serverstand gelegt, damit die Liste im Laden zeigt, was man getippt hat.
  const [pending, setPending] = useState<
    { entryId: string; checked: boolean; clientUpdatedAt: string }[]
  >([]);
  // Vom lokalen Spiegel, falls die Seite ohne Netz aus dem Zwischenspeicher kam.
  const [mirrored, setMirrored] = useState<ListEntry[] | null>(null);

  // Das zweite Handy: jede Änderung an Zeilen oder Herkunft lädt die Liste neu.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    return subscribeToList(supabase, listId, () => router.refresh());
  }, [listId, router]);

  // Frische Serverdaten in den lokalen Spiegel schreiben. Nur dann — eine
  // Seite, die selbst aus dem Zwischenspeicher kam, würde sonst ihren eigenen
  // veralteten Stand als neuen ausgeben.
  useEffect(() => {
    if (!online) return;
    void saveSnapshot({
      listId,
      entries,
      categories,
      savedAt: new Date().toISOString(),
    });
  }, [online, listId, entries, categories]);

  // Kam die Seite ohne Netz aus dem Zwischenspeicher, kann sie beliebig alt
  // sein. Der Spiegel ist dann die bessere Quelle.
  useEffect(() => {
    if (online) return;
    let cancelled = false;
    void loadSnapshot(listId).then((snapshot) => {
      if (!cancelled && snapshot) setMirrored(snapshot.entries);
    });
    return () => {
      cancelled = true;
    };
  }, [online, listId]);

  // Offene Häkchen einlesen und, sobald wieder Netz da ist, nachliefern.
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const supabase = getBrowserSupabase();
      if (online && supabase) {
        const result = await flushOutbox(supabase);
        if (result.sent > 0 && !cancelled) router.refresh();
      }
      const open = await pendingToggles();
      if (!cancelled) setPending(open);
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [online, router]);

  async function toggle(entry: ListEntry) {
    const next = !(checkedNow[entry.id] ?? entry.checked);
    setCheckedNow((current) => ({ ...current, [entry.id]: next }));
    setError("");

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    // Immer zuerst puffern, auch wenn gerade Netz da ist: zwischen Antippen
    // und Antwort kann die Verbindung wegbrechen, und dann wäre das Häkchen
    // sonst verloren. Der Puffer trägt den Zeitpunkt des Antippens — daran
    // entscheidet der Server, wer bei zwei Handys gewinnt.
    const queued = await rememberToggle(entry.id, next);
    setPending((current) => [
      ...current.filter((item) => item.entryId !== entry.id),
      queued,
    ]);

    const result = await setEntryChecked(
      supabase,
      entry.id,
      next,
      queued.clientUpdatedAt,
    );

    if (!result.ok) {
      // Kein Zurücknehmen der Anzeige: der Wunsch liegt im Puffer und geht
      // raus, sobald es wieder geht. Ihn jetzt wegzunehmen wäre eine Lüge.
      return;
    }

    await flushOutbox(supabase);
    setPending(await pendingToggles());

    // Nur neu laden, wenn auch die App selbst erreichbar ist. Sonst schlägt
    // die Anfrage fehl, Next weicht auf einen harten Neuladen aus, und der
    // holt die Seite aus dem Zwischenspeicher — samt weggeworfener Anzeige.
    // Das passiert real, wenn Supabase erreichbar ist, der eigene Server aber
    // nicht: die Änderung IST gespeichert, nur sieht man sie dann nicht mehr.
    if (online) router.refresh();
  }

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Das hat nicht geklappt.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function addByHand() {
    if (!name.trim()) return;
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    // Dieselbe Umrechnung wie beim Rezept: gespeichert wird in der Einheit,
    // in der zusammengefasst wird — sonst stünde „0,5 kg" neben „500 g".
    const parsed = amount.trim() ? parseAmount(amount) : null;
    if (amount.trim() && parsed === null) {
      setError("Die Menge war nicht zu lesen. Zahlen wie 2, 1,5 oder 1/2.");
      return;
    }
    const unit = unitCode || null;

    const done = await run(() =>
      addManualEntry(
        supabase,
        householdId,
        listId,
        name.trim(),
        mergeUnitFor(unit),
        toMergeAmount(parsed, unit),
      ),
    );
    if (done) {
      setName("");
      setAmount("");
      setUnitCode("");
    }
  }

  // Was tatsächlich auf dem Bildschirm steht: der beste bekannte Serverstand —
  // ohne Netz der lokale Spiegel — und darüber die noch nicht gesendeten
  // Häkchen. `applyPendingToggles` übergeht dabei einen Puffereintrag, den das
  // andere Handy inzwischen überholt hat.
  // Der Spiegel zählt nur ohne Netz; mit Netz sind die Serverdaten aktueller.
  // Bewusst hier abgeleitet statt im Effekt zurückgesetzt — React rät davon
  // ab, Zustand in Effekten zu spiegeln.
  const base = !online && mirrored ? mirrored : shownEntries;
  const visibleEntries = applyPendingToggles(base, pending);

  const groups: { name: string; entries: ListEntry[] }[] = [];
  for (const entry of visibleEntries) {
    const last = groups.at(-1);
    if (last && last.name === entry.categoryName) last.entries.push(entry);
    else groups.push({ name: entry.categoryName, entries: [entry] });
  }

  const openCount = visibleEntries.filter(
    (entry) => !(checkedNow[entry.id] ?? entry.checked),
  ).length;

  const unsent = pending.length;

  return (
    <div className="space-y-6">
      {error && <Notice tone="error">{error}</Notice>}

      {!online && (
        <Notice tone="info">
          Kein Netz. Die Liste zeigt den zuletzt geladenen Stand, und dein
          Abhaken wird gemerkt — sobald wieder Empfang da ist, geht es
          automatisch raus.
        </Notice>
      )}
      {online && unsent > 0 && (
        <Notice tone="info">
          {unsent === 1
            ? "Ein Häkchen wartet noch darauf, gesendet zu werden."
            : `${unsent} Häkchen warten noch darauf, gesendet zu werden.`}
        </Notice>
      )}

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Etwas ergänzen
        </h2>
        <div className="mt-3 flex gap-2">
          <input
            aria-label="Zutat"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Zahnpasta"
            autoCapitalize="sentences"
            className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-base outline-none focus:border-accent"
          />
          <input
            aria-label="Menge"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Menge"
            inputMode="decimal"
            className="h-12 w-20 shrink-0 rounded-xl border border-border bg-bg px-3 text-base outline-none focus:border-accent"
          />
          <select
            aria-label="Einheit"
            value={unitCode}
            onChange={(event) => setUnitCode(event.target.value)}
            className="h-12 w-24 shrink-0 appearance-none rounded-xl border border-border bg-bg px-2 text-base outline-none focus:border-accent"
          >
            <option value="">ohne</option>
            {UNITS.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.display}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void addByHand()}
          className="mt-3 h-11 w-full rounded-lg border border-border text-[15px] active:opacity-70 disabled:opacity-50"
        >
          Auf die Liste
        </button>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <p className="text-[15px] leading-relaxed text-muted">
            Die Liste ist leer. Leg ein Rezept auf die Liste oder ergänze etwas
            von Hand.
          </p>
        </Card>
      ) : (
        <p className="text-[13px] text-muted">
          {openCount === 0
            ? "Alles abgehakt."
            : `Noch ${openCount} von ${entries.length}`}
        </p>
      )}

      {groups.map((group) => (
        <section key={group.name} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {group.name}
          </h2>

          <ul className="space-y-2">
            {group.entries.map((entry) => {
              const checked = checkedNow[entry.id] ?? entry.checked;
              const { text } = formatAmount(entry.amount, entry.mergeUnit);
              const isOpen = open === entry.id;

              return (
                <li
                  key={entry.id}
                  className="rounded-xl border border-border bg-surface"
                >
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      aria-pressed={checked}
                      onClick={() => void toggle(entry)}
                      className="flex min-h-14 flex-1 items-center gap-3 px-4 py-3 text-left active:opacity-70"
                    >
                      <span
                        aria-hidden
                        className={
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm " +
                          (checked
                            ? "border-ok bg-ok text-bg"
                            : "border-border")
                        }
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span
                        className={
                          "min-w-0 text-[15px] " +
                          (checked ? "text-muted line-through" : "")
                        }
                      >
                        <span className="font-medium">{entry.name}</span>
                        {(text || entry.hasUnquantified) && (
                          <span className="block text-[13px] text-muted">
                            {text}
                            {entry.hasUnquantified && (text ? " + etwas" : "etwas")}
                          </span>
                        )}
                        {entry.note && (
                          <span className="block text-[13px] text-muted">
                            {entry.note}
                          </span>
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label={`Herkunft von ${entry.name}`}
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : entry.id)}
                      className="w-12 shrink-0 border-l border-border text-muted active:opacity-70"
                    >
                      {isOpen ? "▴" : "▾"}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="space-y-3 border-t border-border px-4 py-3">
                      {entry.sources.length > 0 ? (
                        <ul className="space-y-1 text-[13px] text-muted">
                          {entry.sources.map((source, index) => (
                            <li key={`${source.recipeId}-${index}`}>
                              {source.recipeTitle ?? "Rezept"}
                              {source.servings ? ` (${source.servings})` : ""}
                              {source.amount
                                ? `: ${formatAmount(source.amount, entry.mergeUnit).text}`
                                : ": ohne Menge"}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[13px] text-muted">
                          Von Hand ergänzt.
                        </p>
                      )}

                      {entry.categoryEditable ? (
                        <label className="block">
                          <span className="text-[13px] text-muted">
                            Abteilung
                          </span>
                          <select
                            value={entry.categoryId ?? "sonstiges"}
                            disabled={busy}
                            onChange={(event) =>
                              void run(() => {
                                const supabase = getBrowserSupabase();
                                if (!supabase) {
                                  return Promise.resolve({
                                    ok: false,
                                    error: "Supabase ist nicht konfiguriert.",
                                  });
                                }
                                return setIngredientCategory(
                                  supabase,
                                  entry.ingredientId,
                                  event.target.value,
                                );
                              })
                            }
                            className="mt-1 h-11 w-full appearance-none rounded-lg border border-border bg-bg px-3 text-base outline-none focus:border-accent"
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <span className="mt-1 block text-[13px] text-muted">
                            Bleibt für diese Zutat gespeichert.
                          </span>
                        </label>
                      ) : (
                        <p className="text-[13px] text-muted">
                          Abteilung „{entry.categoryName}“ — aus der
                          Zutatenliste, für alle Haushalte gleich.
                        </p>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void run(() => {
                            const supabase = getBrowserSupabase();
                            if (!supabase) {
                              return Promise.resolve({
                                ok: false,
                                error: "Supabase ist nicht konfiguriert.",
                              });
                            }
                            return deleteEntry(supabase, entry.id);
                          })
                        }
                        className="h-11 w-full rounded-lg border border-accent text-[15px] text-accent active:opacity-70 disabled:opacity-50"
                      >
                        Zeile entfernen
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="text-center text-[15px]">
        <Link href="/rezepte" className="text-muted underline underline-offset-4">
          Rezepte
        </Link>
      </p>
    </div>
  );
}
