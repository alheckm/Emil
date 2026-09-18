"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAmount } from "@/lib/core/format";
import { ingredientImage } from "@/lib/core/ingredientImages";
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
 * - **Antippen hakt ab.** Die ganze Kachel ist die Trefferfläche, nicht ein
 *   kleines Kästchen — die App wird einhändig und in Bewegung bedient.
 * - **Abgehaktes bleibt stehen.** Einträge nach unten wandern zu lassen sieht
 *   aufgeräumt aus, verschiebt aber im selben Moment die Kachel darunter unter
 *   den Daumen, der schon unterwegs ist.
 * - **Drei pro Reihe, Bild oben, Name und Menge darunter** — nach dem Entwurf
 *   in app_design.jpg. Ein Bild ist im Laden schneller erfasst als ein Wort;
 *   man sucht im Regal nach der Sache, nicht nach ihrem Namen. Fehlt das Bild,
 *   steht der Anfangsbuchstabe im Kreis, damit die Reihe nicht ausfranst.
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
  const [open, setOpen] = useState<string | null>(null);
  const [checkedNow, setCheckedNow] = useState<Record<string, boolean>>({});

  // Zeilen, die schon weg sind, obwohl der Server es noch nicht bestätigt hat.
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  // Was gerade von Hand ergänzt wurde und noch nicht zurückgekommen ist. Die
  // stehen bewusst in einer eigenen Liste und nicht zwischen den echten
  // Zeilen: welcher Abteilung eine neue Zutat zugeschlagen wird, entscheidet
  // der Server (`resolve_ingredient`). Sie hier zu raten und anschließend
  // umspringen zu lassen wäre unehrlicher als ein eigener kurzer Abschnitt.
  const [adding, setAdding] = useState<{ id: string; label: string }[]>([]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unitCode, setUnitCode] = useState("");

  // Neue Daten vom Server: die eigenen, vorgezogenen Änderungen sind darin
  // enthalten und werden hier wieder fallen gelassen. Das passiert beim
  // Rendern und nicht in einem Effekt — sonst zeigte die Liste für einen
  // Durchgang den alten Stand über den neuen Daten.
  //
  // Genau hierfür steht der vorgezogene Zustand in gewöhnlichem `useState` und
  // nicht in `useOptimistic`: `router.refresh()` liefert kein Versprechen
  // zurück, das man abwarten könnte. Eine Transition wäre also schon zu Ende,
  // bevor die frischen Daten da sind — und die abgehakte Zeile blitzte für
  // einen Moment wieder auf. Hier fällt der vorgezogene Stand erst, wenn die
  // neuen Daten wirklich anliegen.
  const [shownEntries, setShownEntries] = useState(entries);
  if (shownEntries !== entries) {
    setShownEntries(entries);
    setCheckedNow({});
    setRemoved(new Set());
    setAdding([]);
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
    return subscribeToList(supabase, listId, () =>
      startTransition(() => router.refresh()),
    );
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
        if (result.sent > 0 && !cancelled) {
          startTransition(() => router.refresh());
        }
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
    //
    // In einer Transition, damit das Nachladen die Liste nicht anhält: das
    // Häkchen steht längst, hier wird nur noch der Serverstand nachgezogen.
    if (online) startTransition(() => router.refresh());
  }

  /**
   * Eine Änderung abschicken, ohne die Oberfläche anzuhalten.
   *
   * Vorher stand hier ein `busy`-Schalter, der während des Wartens *jeden*
   * Knopf der Liste gesperrt hat — bei einer Runde über Mobilfunk also die
   * ganze Liste für eine halbe Sekunde. Der Aufrufer zieht die Anzeige jetzt
   * selbst vor; hier bleibt nur noch Abschicken, Fehler melden und
   * nachladen.
   *
   * `zurueck` nimmt die vorgezogene Anzeige wieder weg, wenn es schiefging.
   */
  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    zurueck?: () => void,
  ) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        zurueck?.();
        setError(result.error ?? "Das hat nicht geklappt.");
        return;
      }
      router.refresh();
    });
  }

  function removeEntry(entry: ListEntry) {
    // Zuerst verschwinden lassen, dann senden. Kommt ein Fehler zurück, steht
    // die Zeile wieder da und die Meldung erklärt, warum.
    setRemoved((current) => new Set(current).add(entry.id));

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setRemoved((current) => {
        const next = new Set(current);
        next.delete(entry.id);
        return next;
      });
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    run(
      () => deleteEntry(supabase, entry.id),
      () =>
        setRemoved((current) => {
          const next = new Set(current);
          next.delete(entry.id);
          return next;
        }),
    );
  }

  function addByHand() {
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
    const label = name.trim();
    const id = crypto.randomUUID();

    // Felder sofort leeren und die Zutat sofort anzeigen. Wer im Laden drei
    // Dinge hintereinander eintippt, soll nicht zwischendurch auf den Server
    // warten müssen.
    setAdding((current) => [...current, { id, label }]);
    setName("");
    setAmount("");
    setUnitCode("");

    run(
      () =>
        addManualEntry(
          supabase,
          householdId,
          listId,
          label,
          mergeUnitFor(unit),
          toMergeAmount(parsed, unit),
        ),
      () => {
        setAdding((current) => current.filter((item) => item.id !== id));
        // Zurück ins Feld, damit nichts verloren geht.
        setName(label);
        setAmount(amount);
        setUnitCode(unitCode);
      },
    );
  }

  // Was tatsächlich auf dem Bildschirm steht: der beste bekannte Serverstand —
  // ohne Netz der lokale Spiegel — und darüber die noch nicht gesendeten
  // Häkchen. `applyPendingToggles` übergeht dabei einen Puffereintrag, den das
  // andere Handy inzwischen überholt hat.
  // Der Spiegel zählt nur ohne Netz; mit Netz sind die Serverdaten aktueller.
  // Bewusst hier abgeleitet statt im Effekt zurückgesetzt — React rät davon
  // ab, Zustand in Effekten zu spiegeln.
  const base = !online && mirrored ? mirrored : shownEntries;
  // Zuletzt noch das, was gerade entfernt wurde — es soll im selben Frame
  // verschwinden, in dem getippt wurde, nicht wenn der Server geantwortet hat.
  const visibleEntries = applyPendingToggles(base, pending).filter(
    (entry) => !removed.has(entry.id),
  );

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
            className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-bg px-3 text-base outline-none focus:border-accent"
          />
          <input
            aria-label="Menge"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Menge"
            inputMode="decimal"
            className="h-12 w-20 shrink-0 rounded-2xl border border-border bg-bg px-3 text-base outline-none focus:border-accent"
          />
          <select
            aria-label="Einheit"
            value={unitCode}
            onChange={(event) => setUnitCode(event.target.value)}
            className="h-12 w-24 shrink-0 appearance-none rounded-2xl border border-border bg-bg px-2 text-base outline-none focus:border-accent"
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
          disabled={!name.trim()}
          onClick={addByHand}
          className="mt-3 h-11 w-full rounded-pill border border-border text-[15px] press disabled:opacity-50"
        >
          Auf die Liste
        </button>
      </Card>

      {visibleEntries.length + adding.length === 0 ? (
        <Card>
          <p className="text-[15px] leading-relaxed text-muted">
            Die Liste ist leer. Leg ein Rezept auf die Liste oder ergänze etwas
            von Hand.
          </p>
        </Card>
      ) : (
        <p className="text-[13px] text-muted">
          {openCount + adding.length === 0
            ? "Alles abgehakt."
            : `Noch ${openCount + adding.length} von ${
                visibleEntries.length + adding.length
              }`}
        </p>
      )}

      {adding.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-[19px] font-semibold tracking-tight">
            Wird ergänzt
          </h2>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5">
            {adding.map((item) => (
              <li key={item.id} className="flex flex-col items-center gap-2 opacity-50">
                <span className="aspect-square w-full rounded-pill bg-surface" />
                <span className="w-full text-center text-[13px] font-medium leading-tight">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.map((group) => {
        // Die aufgeklappten Details stehen unter dem Raster und nicht in der
        // Kachel: eine Kachel ist gut 100 px breit, darin wäre eine Auswahlbox
        // für die Abteilung nicht zu bedienen.
        const openEntry = group.entries.find((entry) => entry.id === open);

        return (
          <section key={group.name} className="space-y-3">
            <h2 className="font-display text-[19px] font-semibold tracking-tight">
              {group.name}
            </h2>

            <ul className="grid grid-cols-3 gap-x-3 gap-y-5">
              {group.entries.map((entry) => {
                const checked = checkedNow[entry.id] ?? entry.checked;
                const { text } = formatAmount(entry.amount, entry.mergeUnit);
                const src = ingredientImage(entry.name);
                const menge = [
                  text,
                  entry.hasUnquantified ? (text ? "+ etwas" : "etwas") : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const isOpen = open === entry.id;

                return (
                  <li key={entry.id} className="relative">
                    <button
                      type="button"
                      aria-pressed={checked}
                      onClick={() => void toggle(entry)}
                      className="flex w-full flex-col items-center gap-2 press-flat tap-target"
                    >
                      <span className="relative block aspect-square w-full">
                        <span
                          className={
                            "flex h-full w-full items-center justify-center " +
                            "overflow-hidden rounded-pill bg-surface " +
                            // Abgehakt wird das Bild blass, das Häkchen
                            // darüber bleibt kräftig — sonst verschwindet
                            // genau die Rückmeldung mit, auf die man wartet.
                            (checked ? "opacity-40" : "")
                          }
                        >
                          {src ? (
                            /* Kein next/image: die Datei liegt schon in genau
                               der Größe im public-Ordner, in der sie gebraucht
                               wird. Der Optimierer hätte hier nichts zu tun
                               und käme nur als zusätzliche Runde dazu. */
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={src}
                              alt=""
                              width={192}
                              height={192}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden
                              className="text-[24px] font-medium text-muted"
                            >
                              {entry.name.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </span>

                        {checked && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span
                              aria-hidden
                              className="flex h-9 w-9 items-center justify-center rounded-pill bg-text text-[17px] text-bg"
                            >
                              ✓
                            </span>
                          </span>
                        )}
                      </span>

                      <span className="w-full text-center">
                        <span
                          className={
                            "block text-[13px] font-medium leading-tight " +
                            (checked ? "text-muted line-through" : "")
                          }
                        >
                          {entry.name}
                        </span>
                        {menge && (
                          <span className="mt-0.5 block text-[12px] leading-tight text-muted">
                            {menge}
                          </span>
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label={`Details zu ${entry.name}`}
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : entry.id)}
                      className={
                        "absolute right-0 top-0 flex h-8 w-8 items-center justify-center " +
                        "rounded-pill border border-border bg-surface text-[15px] leading-none press-flat " +
                        (isOpen ? "text-text" : "text-muted")
                      }
                    >
                      ⋯
                    </button>
                  </li>
                );
              })}
            </ul>

            {openEntry && (
              <div className="space-y-3 rounded-card border border-border bg-surface p-4">
                <p className="text-[15px] font-medium">{openEntry.name}</p>

                {openEntry.note && (
                  <p className="text-[13px] text-muted">{openEntry.note}</p>
                )}

                {openEntry.sources.length > 0 ? (
                  <ul className="space-y-1 text-[13px] text-muted">
                    {openEntry.sources.map((source, index) => (
                      <li key={`${source.recipeId}-${index}`}>
                        {source.recipeTitle ?? "Rezept"}
                        {source.servings ? ` (${source.servings})` : ""}
                        {source.amount
                          ? `: ${formatAmount(source.amount, openEntry.mergeUnit).text}`
                          : ": ohne Menge"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-muted">Von Hand ergänzt.</p>
                )}

                {openEntry.categoryEditable ? (
                  <label className="block">
                    <span className="text-[13px] text-muted">Abteilung</span>
                    <select
                      value={openEntry.categoryId ?? "sonstiges"}
                      onChange={(event) =>
                        run(() => {
                          const supabase = getBrowserSupabase();
                          if (!supabase) {
                            return Promise.resolve({
                              ok: false,
                              error: "Supabase ist nicht konfiguriert.",
                            });
                          }
                          return setIngredientCategory(
                            supabase,
                            openEntry.ingredientId,
                            event.target.value,
                          );
                        })
                      }
                      className="mt-1 h-11 w-full appearance-none rounded-2xl border border-border bg-bg px-3 text-base outline-none focus:border-accent"
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
                    Abteilung „{openEntry.categoryName}“ — aus der Zutatenliste,
                    für alle Haushalte gleich.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => removeEntry(openEntry)}
                  className="h-11 w-full rounded-pill border border-accent text-[15px] text-accent press"
                >
                  Von der Liste nehmen
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
