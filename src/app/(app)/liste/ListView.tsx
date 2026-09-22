"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { formatAmount } from "@/lib/core/format";
import { ingredientImage } from "@/lib/core/ingredientImages";
import { parseQuickAdd } from "@/lib/core/parseIngredient";
import { getUnit, mergeUnitFor } from "@/lib/core/units";
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
  setEntryAmount,
  setEntryChecked,
  setHouseholdIngredientCategory,
  setIngredientCategory,
  type Category,
  type ListEntry,
} from "@/lib/data/shoppingList";
import { Section, Notice } from "@/components/ui";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";

// Wie lange eine frisch abgehakte Kachel an ihrem Platz stehen bleibt, bevor
// sie in den Abschnitt „Eingekauft" wandert — lang genug, um das eigene
// Häkchen noch wahrzunehmen, kurz genug, um nicht wie ein Hänger zu wirken.
const CHECKED_SECTION_DELAY_MS = 500;

// Die Abteilung „Gewürze und Öle" (Gewürze, Öle, Essig, Brühe — nicht aber
// Saucen, die unter „Sonstiges" laufen, siehe ingredient-seed-data.mjs) bekommt
// einen eigenen Abschnitt direkt über „Eingekauft" statt zwischen den übrigen
// offenen Zeilen zu stehen — ein kurzer Blick in den Vorrat, bevor man sie dem
// Wocheneinkauf zuschlägt. Von Hand ergänzt landet trotzdem oben im Hauptteil
// (siehe `openEntries`/`stockCheckEntries` unten): wer „Salz" oder „Curry" von
// Hand einträgt, meint das jetzt, nicht „vielleicht ist noch was da". Keine
// eigene Abteilung dafür — nur diese eine wird unter anderer Überschrift gezeigt.
const STOCK_CHECK_CATEGORY_ID = "gewuerze";

/**
 * Die Einkaufsliste, wie sie im Supermarkt benutzt wird.
 *
 * Drei Entscheidungen, die aus genau dieser Situation kommen:
 *
 * - **Antippen hakt ab.** Die ganze Kachel ist die Trefferfläche, nicht ein
 *   kleines Kästchen — die App wird einhändig und in Bewegung bedient.
 * - **Abgehaktes wandert in einen eigenen Abschnitt.** Kurz nach dem Antippen
 *   (`CHECKED_SECTION_DELAY_MS`) — man soll das eigene Häkchen noch an seinem
 *   Platz sehen, bevor die Kachel unter „Eingekauft" auftaucht. Dort steht das
 *   zuletzt Abgehakte oben. Über 20 Abgehakte sammeln sich ohnehin nicht an —
 *   `set_entry_checked` löscht die ältesten, sobald ein 21. dazukommt
 *   (Migration 0016), unabhängig davon, welches Handy gerade offen ist.
 * - **Drei pro Reihe, Bild oben, Name und Menge darunter.** Ein Bild ist im
 *   Laden schneller erfasst als ein Wort; man sucht im Regal nach der Sache,
 *   nicht nach ihrem Namen. Fehlt das Bild, steht der Anfangsbuchstabe in der
 *   Kachel, damit die Reihe nicht ausfranst.
 * - **Das Häkchen wirkt sofort**, auch bevor der Server geantwortet hat. Geht
 *   es schief, springt es zurück und die Meldung erklärt warum.
 * - **Ein Raster, nach Abteilung geordnet — ohne Überschriften.** Die
 *   Abteilung entscheidet nur die Reihenfolge der Kacheln, nicht ob dazwischen
 *   eine Zeile mit ihrem Namen steht. Die Liste besteht ausschließlich aus
 *   Kacheln — mit einer Ausnahme: Zutaten der Abteilung „Gewürze und Öle"
 *   stehen in einem eigenen Abschnitt direkt über „Eingekauft", unter der
 *   Überschrift „Noch vorrätig?" — weil man die eher noch im Schrank hat als
 *   den Rest der Liste. Von Hand ergänzt umgeht das bewusst — siehe
 *   `STOCK_CHECK_CATEGORY_ID`.
 * - **Details per Longpress.** Gehalten (500 ms) öffnet eine Leiste vom
 *   unteren Bildschirmrand mit Mengen-Stepper, Herkunft, Abteilung (für jede
 *   Zutat änderbar, nicht nur eigene — Migration 0019) und „von der Liste
 *   nehmen". Ein kurzer Antipper hakt weiterhin ab, wie gehabt.
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
  // Welche Zeile die Detailleiste zeigt — geöffnet per Longpress (`startPress`).
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const [checkedNow, setCheckedNow] = useState<Record<string, boolean>>({});
  // Menge, wie sie der Stepper in der Detailleiste zuletzt gesetzt hat, noch
  // bevor der Server geantwortet hat — selbes Vorgehen wie `checkedNow`.
  const [amountNow, setAmountNow] = useState<Record<string, string>>({});
  // Ob eine Zeile schon im Abschnitt „Eingekauft" steht. Folgt `checkedNow` mit
  // Verzögerung beim Abhaken (siehe `CHECKED_SECTION_DELAY_MS`), damit das
  // Häkchen erst kurz an seinem Platz zu sehen ist, bevor die Kachel wandert
  // — beim Abwählen sofort, da rutscht nichts weg, das man noch anschaut.
  const [sectionChecked, setSectionChecked] = useState<
    Record<string, boolean>
  >({});
  // Zeitpunkt des Antippens, für die Reihenfolge im Abschnitt: zuletzt
  // abgehakt steht oben. Bis der Server antwortet, zählt dieser lokale Wert;
  // danach übernimmt `entry.checkedAt`.
  const [checkedAtNow, setCheckedAtNow] = useState<Record<string, number>>(
    {},
  );
  const sectionTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  // Nur beim Unmount aufräumen — nicht bei jedem neuen `entries` von Server:
  // Ein Refresh (eigener Toggle, Realtime, Outbox-Sync — davon laufen pro
  // Antippen mehrere) darf den laufenden Timer nicht kappen, sonst wandert
  // die Kachel nie in den Abschnitt „Eingekauft".
  useEffect(() => {
    const timers = sectionTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // Longpress statt „⋯"-Knopf: gehalten öffnet die Detailleiste, kurz
  // angetippt hakt ab. `longPressed` unterscheidet die beiden — der native
  // Klick, der nach dem Loslassen kommt, hakt nur ab, wenn der Timer nicht
  // schon ausgelöst hat.
  const pressRef = useRef<{
    id: string | null;
    timer: ReturnType<typeof setTimeout> | null;
    longPressed: boolean;
  }>({ id: null, timer: null, longPressed: false });

  function startPress(entryId: string) {
    pressRef.current.id = entryId;
    pressRef.current.longPressed = false;
    pressRef.current.timer = setTimeout(() => {
      pressRef.current.longPressed = true;
      setOpenSheet(entryId);
    }, 500);
  }

  function cancelPress() {
    if (pressRef.current.timer) {
      clearTimeout(pressRef.current.timer);
      pressRef.current.timer = null;
    }
  }

  function tap(entry: ListEntry) {
    if (pressRef.current.longPressed) {
      pressRef.current.longPressed = false;
      return;
    }
    void toggle(entry);
  }

  // Zeilen, die schon weg sind, obwohl der Server es noch nicht bestätigt hat.
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  // Was gerade von Hand ergänzt wurde und noch nicht zurückgekommen ist. Die
  // stehen bewusst in einer eigenen Liste und nicht zwischen den echten
  // Zeilen: welcher Abteilung eine neue Zutat zugeschlagen wird, entscheidet
  // der Server (`resolve_ingredient`). Sie hier zu raten und anschließend
  // umspringen zu lassen wäre unehrlicher als ein eigener kurzer Abschnitt.
  const [adding, setAdding] = useState<{ id: string; label: string }[]>([]);

  const [entryText, setEntryText] = useState("");

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
  // `sectionChecked`/`checkedAtNow` werden hier bewusst NICHT zurückgesetzt:
  // Sobald der Server den Toggle bestätigt (meist deutlich vor Ablauf der
  // Verzögerung), stünde `entry.checked` sonst schon auf `true`, und die
  // Kachel würde sofort in den Abschnitt springen statt die Verzögerung
  // abzuwarten. Beide Zustände tragen für jede angefasste Zeile immer einen
  // expliziten Wert (siehe `scheduleSection`), sind also nie von frischen
  // Serverdaten abhängig.
  const [shownEntries, setShownEntries] = useState(entries);
  if (shownEntries !== entries) {
    setShownEntries(entries);
    setCheckedNow({});
    setAmountNow({});
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

  function scheduleSection(entryId: string, next: boolean) {
    const existing = sectionTimers.current[entryId];
    if (existing) {
      clearTimeout(existing);
      delete sectionTimers.current[entryId];
    }
    // Sofort explizit offen setzen, in beiden Fällen: beim Abwählen bleibt es
    // dabei, beim Abhaken hält es die Kachel an ihrem Platz, bis der Timer
    // unten sie freigibt. Ohne dieses explizite `false` würde die Kachel
    // sofort springen, sobald der Server den Toggle bestätigt.
    setSectionChecked((current) => ({ ...current, [entryId]: false }));
    if (next) {
      sectionTimers.current[entryId] = setTimeout(() => {
        delete sectionTimers.current[entryId];
        setSectionChecked((current) => ({ ...current, [entryId]: true }));
      }, CHECKED_SECTION_DELAY_MS);
    }
  }

  async function toggle(entry: ListEntry) {
    const next = !(checkedNow[entry.id] ?? entry.checked);
    setCheckedNow((current) => ({ ...current, [entry.id]: next }));
    if (next) {
      setCheckedAtNow((current) => ({ ...current, [entry.id]: Date.now() }));
    }
    scheduleSection(entry.id, next);
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
   * Menge über den Stepper in der Detailleiste setzen — sofort sichtbar,
   * ohne den Offline-Puffer der Häkchen: anders als das Abhaken ist das kein
   * Feld, das zwei Handys im selben Moment gegenläufig setzen, „letzter
   * Schreiber gewinnt" reicht hier (siehe Migration 0018).
   */
  async function changeAmount(entry: ListEntry, next: number) {
    setAmountNow((current) => ({ ...current, [entry.id]: String(next) }));
    setError("");

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    const result = await setEntryAmount(supabase, entry.id, next);
    if (!result.ok) {
      setAmountNow((current) => {
        const rest = { ...current };
        delete rest[entry.id];
        return rest;
      });
      setError(result.error);
      return;
    }

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
    const text = entryText.trim();
    if (!text) return;
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    // Menge und Einheit stecken im selben Feld: „Erdbeeren 3", „Schmand 150
    // ml", „Tomaten 500g" — der Parser trennt sie, mit oder ohne Leerzeichen.
    const { name: label, amount: parsed, unitCode } = parseQuickAdd(text);
    const unit = unitCode || null;
    const id = crypto.randomUUID();

    // Feld sofort leeren und die Zutat sofort anzeigen. Wer im Laden drei
    // Dinge hintereinander eintippt, soll nicht zwischendurch auf den Server
    // warten müssen.
    setAdding((current) => [...current, { id, label }]);
    setEntryText("");

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
        setEntryText(text);
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

  const openCount = visibleEntries.filter(
    (entry) => !(checkedNow[entry.id] ?? entry.checked),
  ).length;

  // Aufgeteilt in „offen" und „Eingekauft": `sectionChecked` folgt `checkedNow`
  // erst mit Verzögerung, darum bleibt eine frisch abgehakte Kachel kurz an
  // ihrem Platz stehen (siehe `scheduleSection`). Offene behalten die
  // Reihenfolge nach Abteilung und Name aus `listEntries`; im Abschnitt
  // „Eingekauft" steht das zuletzt Abgehakte oben.
  const openEntries: ListEntry[] = [];
  const stockCheckEntries: ListEntry[] = [];
  const checkedEntries: ListEntry[] = [];
  for (const entry of visibleEntries) {
    const settled = sectionChecked[entry.id] ?? entry.checked;
    if (settled) {
      checkedEntries.push(entry);
    } else if (entry.categoryId === STOCK_CHECK_CATEGORY_ID && !entry.isManual) {
      stockCheckEntries.push(entry);
    } else {
      openEntries.push(entry);
    }
  }
  checkedEntries.sort((a, b) => {
    const aAt = checkedAtNow[a.id] ?? (a.checkedAt ? Date.parse(a.checkedAt) : 0);
    const bAt = checkedAtNow[b.id] ?? (b.checkedAt ? Date.parse(b.checkedAt) : 0);
    return bAt - aAt;
  });

  function renderEntry(entry: ListEntry) {
    const checked = checkedNow[entry.id] ?? entry.checked;
    const amount = amountNow[entry.id] ?? entry.amount;
    const { text } = formatAmount(amount, entry.mergeUnit);
    const src = ingredientImage(entry.name);
    const menge = [
      text,
      entry.hasUnquantified ? (text ? "+ etwas" : "etwas") : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <li key={entry.id} className="relative">
        <div className="flex h-full flex-col overflow-hidden rounded-tile bg-chip">
          <button
            type="button"
            aria-pressed={checked}
            onPointerDown={() => startPress(entry.id)}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onPointerCancel={cancelPress}
            onContextMenu={(event) => event.preventDefault()}
            onClick={() => tap(entry)}
            className="flex select-none flex-col press-flat tap-target touch-manipulation"
          >
            <span className="relative block aspect-square w-full p-3">
              <span
                className={
                  "flex h-full w-full items-center justify-center overflow-hidden rounded-full " +
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
                    className="flex h-9 w-9 items-center justify-center rounded-pill bg-accent text-[17px] text-accent-ink"
                  >
                    ✓
                  </span>
                </span>
              )}
            </span>

            <span className="w-full px-2 pb-2 pt-1 text-center">
              <span
                className={
                  "block text-[13px] font-medium leading-tight " +
                  (checked ? "text-muted line-through" : "")
                }
              >
                {entry.name}
              </span>
              {/* Immer gerendert, notfalls unsichtbar: sonst wird
                  eine Kachel ohne Menge einen Zeile kürzer als ihre
                  Nachbarn in derselben Reihe. */}
              <span
                className={
                  "mt-0.5 block text-[13px] leading-tight " +
                  (menge ? "" : "invisible")
                }
              >
                {menge || " "}
              </span>
            </span>
          </button>
        </div>
      </li>
    );
  }

  const sheetEntry = visibleEntries.find((entry) => entry.id === openSheet) ?? null;

  function renderSheet() {
    if (!sheetEntry) return null;
    const entry = sheetEntry;
    const amount = amountNow[entry.id] ?? entry.amount;
    const unit = getUnit(entry.mergeUnit);
    // Rechnung, nicht Anzeige: „ohne" ist kein echtes Einheitenzeichen
    // (mengenlose Zeile, Migration 0010) und hat nichts, was ein Stepper
    // sinnvoll auf- oder abzählen könnte.
    const steppable = entry.mergeUnit !== "ohne";
    const step = unit && (unit.dimension === "mass" || unit.dimension === "volume") ? 50 : 1;

    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        onClick={() => setOpenSheet(null)}
      >
        <div className="absolute inset-0 bg-text/40" aria-hidden />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={entry.name}
          onClick={(event) => event.stopPropagation()}
          className="relative w-full max-w-md rounded-t-card bg-card px-5 pb-safe pt-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[17px] font-semibold leading-[1.3]">
              {entry.name}
            </h2>
            <button
              type="button"
              aria-label="Schließen"
              onClick={() => setOpenSheet(null)}
              className="-mr-2 flex h-11 w-11 items-center justify-center press-flat tap-target"
            >
              <CloseIcon className="h-5 w-5 text-muted" />
            </button>
          </div>

          <div className="space-y-3 pb-6 pt-2 text-left">
            {steppable && (
              <div className="flex items-center justify-between border-t border-border py-3">
                <span className="text-[15px]">Menge</span>
                <AmountStepper
                  value={Number(amount ?? 0)}
                  mergeUnit={entry.mergeUnit}
                  step={step}
                  onChange={(next) => void changeAmount(entry, next)}
                />
              </div>
            )}

            {entry.note && (
              <p className="text-[13px] text-muted">{entry.note}</p>
            )}

            {entry.sources.length > 0 ? (
              <ul className="space-y-1 text-[13px] text-muted">
                {entry.sources.map((source, sourceIndex) => (
                  <li key={`${source.recipeId}-${sourceIndex}`}>
                    {source.recipeTitle ?? "Rezept"}
                    {source.servings ? ` (${source.servings})` : ""}
                    {source.amount
                      ? `: ${formatAmount(source.amount, entry.mergeUnit).text}`
                      : ": ohne Menge"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted">Von Hand ergänzt.</p>
            )}

            <label className="block">
              <span className="text-[13px] text-muted">Abteilung</span>
              <select
                value={entry.categoryId ?? "sonstiges"}
                onChange={(event) =>
                  run(() => {
                    const supabase = getBrowserSupabase();
                    if (!supabase) {
                      return Promise.resolve({
                        ok: false,
                        error: "Supabase ist nicht konfiguriert.",
                      });
                    }
                    // Eigene Zutaten werden direkt umgehängt; globale aus dem
                    // Seed gehören allen Haushalten, ihre Abteilung ändert
                    // sich darum nur für den eigenen Haushalt (Migration 0019).
                    return entry.categoryOwnedByHousehold
                      ? setIngredientCategory(
                          supabase,
                          entry.ingredientId,
                          event.target.value,
                        )
                      : setHouseholdIngredientCategory(
                          supabase,
                          householdId,
                          entry.ingredientId,
                          event.target.value,
                        );
                  })
                }
                className="mt-1 h-11 w-full appearance-none rounded-soft border border-border bg-soft px-3 text-base outline-none focus:border-text"
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

            <button
              type="button"
              onClick={() => {
                setOpenSheet(null);
                removeEntry(entry);
              }}
              className="h-11 w-full rounded-pill border border-danger text-[15px] text-danger press"
            >
              Von der Liste nehmen
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      <Section>
        <input
          aria-label="Etwas ergänzen"
          value={entryText}
          onChange={(event) => setEntryText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addByHand();
          }}
          placeholder="Etwas ergänzen"
          autoCapitalize="sentences"
          enterKeyHint="done"
          className="h-12 w-full rounded-soft border border-border bg-soft px-3 text-base outline-none focus:border-text"
        />
      </Section>

      {visibleEntries.length + adding.length === 0 ? (
        <Section>
          <p className="text-[15px] leading-relaxed text-muted">
            Die Liste ist leer. Leg ein Rezept auf die Liste oder ergänze etwas
            von Hand.
          </p>
        </Section>
      ) : (
        <p className="text-[13px]">
          {openCount + adding.length === 0
            ? "Alles abgehakt."
            : `Noch ${openCount + adding.length} von ${
                visibleEntries.length + adding.length
              }`}
        </p>
      )}

      {adding.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-[15px] font-semibold leading-[1.3]">
            Wird ergänzt
          </h2>
          <ul className="grid grid-cols-3 gap-x-2 gap-y-3">
            {adding.map((item) => (
              <li key={item.id} className="flex flex-col items-center gap-2 opacity-50">
                <span className="aspect-square w-full rounded-full bg-chip" />
                <span className="w-full text-center text-[13px] font-medium leading-tight">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="grid grid-cols-3 items-start gap-x-2 gap-y-3">
        {openEntries.map(renderEntry)}
      </ul>

      {stockCheckEntries.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-[15px] font-semibold leading-[1.3]">
            Noch vorrätig?
          </h2>
          <ul className="grid grid-cols-3 items-start gap-x-2 gap-y-3">
            {stockCheckEntries.map(renderEntry)}
          </ul>
        </section>
      )}

      {checkedEntries.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-[15px] font-semibold leading-[1.3]">
            Eingekauft
          </h2>
          <ul className="grid grid-cols-3 items-start gap-x-2 gap-y-3">
            {checkedEntries.map(renderEntry)}
          </ul>
        </section>
      )}

      {renderSheet()}
    </div>
  );
}

/**
 * Mengen-Stepper in der Detailleiste — dieselbe Formensprache wie
 * `ServingStepper` im Rezept-Screen (RecipeActions.tsx), aber auf Basis
 * eines echten Mengenwerts statt einer Portionszahl: Schrittweite und
 * Formatierung richten sich nach der Einheit (`step`, `formatAmount`), nicht
 * nach einer festen Zahl von Portionen. Eine eigene, kleine Kopie statt einer
 * gemeinsamen Komponente — die beiden Bildschirme haben sonst nichts
 * miteinander zu tun.
 */
function AmountStepper({
  value,
  mergeUnit,
  step,
  onChange,
}: {
  value: number;
  mergeUnit: string;
  step: number;
  onChange: (next: number) => void;
}) {
  const { text } = formatAmount(String(value), mergeUnit);
  return (
    <div className="flex items-center rounded-pill bg-soft">
      <AmountStepperButton
        label="Weniger"
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - step))}
      >
        <MinusIcon className="h-4 w-4" />
      </AmountStepperButton>
      <span
        aria-live="polite"
        className="min-w-[4.5rem] text-center text-[13px] font-medium"
      >
        <span key={value} className="count-swap tabular-nums">
          {text || "0"}
        </span>
      </span>
      <AmountStepperButton label="Mehr" onClick={() => onChange(value + step)}>
        <PlusIcon className="h-4 w-4" />
      </AmountStepperButton>
    </div>
  );
}

function AmountStepperButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center press tap-target disabled:opacity-30"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-card">
        {children}
      </span>
    </button>
  );
}
