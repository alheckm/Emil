import { describe, expect, it } from "vitest";
import { applyPendingToggles, stalePendingToggles } from "../pendingToggles";

const entry = (over: Partial<{ id: string; checked: boolean; updatedAt: string }> = {}) => ({
  id: "e1",
  checked: false,
  updatedAt: "2026-09-17T10:00:00+00:00",
  ...over,
});

describe("applyPendingToggles", () => {
  it("zeigt das offline gesetzte Häkchen an", () => {
    const result = applyPendingToggles(
      [entry()],
      [{ entryId: "e1", checked: true, clientUpdatedAt: "2026-09-17T10:05:00.000Z" }],
    );
    expect(result[0].checked).toBe(true);
  });

  it("lässt den Server gewinnen, wenn das andere Handy später getippt hat", () => {
    // Handy A hakt um 10:05 offline ab, Handy B nimmt um 10:07 das Häkchen
    // wieder weg. Sobald A wieder Netz hat, gilt der spätere Stand.
    const result = applyPendingToggles(
      [entry({ checked: false, updatedAt: "2026-09-17T10:07:00+00:00" })],
      [{ entryId: "e1", checked: true, clientUpdatedAt: "2026-09-17T10:05:00.000Z" }],
    );
    expect(result[0].checked).toBe(false);
  });

  it("vergleicht Zeitpunkte und nicht Zeichenketten", () => {
    // Derselbe Moment in zwei Schreibweisen: Postgres schreibt „+00:00" mit
    // Mikrosekunden, der Browser „Z" mit Millisekunden. Als Text verglichen
    // käme hier das falsche Ergebnis heraus.
    const result = applyPendingToggles(
      [entry({ updatedAt: "2026-09-17T10:00:00.000000+00:00" })],
      [{ entryId: "e1", checked: true, clientUpdatedAt: "2026-09-17T10:00:00.000Z" }],
    );
    expect(result[0].checked).toBe(true);
  });

  it("lässt Zeilen ohne Puffereintrag unangetastet", () => {
    const entries = [entry({ id: "a" }), entry({ id: "b", checked: true })];
    const result = applyPendingToggles(entries, [
      { entryId: "a", checked: true, clientUpdatedAt: "2026-09-17T11:00:00.000Z" },
    ]);
    expect(result[0].checked).toBe(true);
    expect(result[1].checked).toBe(true);
    expect(result[1]).toBe(entries[1]);
  });

  it("gibt bei leerem Puffer dieselben Zeilen zurück", () => {
    const entries = [entry()];
    expect(applyPendingToggles(entries, [])).toEqual(entries);
  });

  it("kommt mit unlesbaren Zeitstempeln klar, ohne etwas zu verfälschen", () => {
    const result = applyPendingToggles(
      [entry({ updatedAt: "kaputt" })],
      [{ entryId: "e1", checked: true, clientUpdatedAt: "2026-09-17T10:05:00.000Z" }],
    );
    // Im Zweifel bleibt der Serverstand stehen.
    expect(result[0].checked).toBe(false);
  });
});

describe("stalePendingToggles", () => {
  it("nennt überholte Puffereinträge, damit sie verworfen werden", () => {
    const stale = stalePendingToggles(
      [entry({ id: "alt", updatedAt: "2026-09-17T12:00:00+00:00" }), entry({ id: "neu" })],
      [
        { entryId: "alt", checked: true, clientUpdatedAt: "2026-09-17T10:00:00.000Z" },
        { entryId: "neu", checked: true, clientUpdatedAt: "2026-09-17T13:00:00.000Z" },
      ],
    );
    expect(stale).toEqual(["alt"]);
  });

  it("verwirft nichts, was zu keiner bekannten Zeile gehört", () => {
    // Die Zeile könnte auf einem anderen Gerät gerade erst entstanden sein.
    expect(
      stalePendingToggles([], [{ entryId: "x", checked: true, clientUpdatedAt: "2026-09-17T10:00:00.000Z" }]),
    ).toEqual([]);
  });
});
