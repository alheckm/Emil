import { describe, expect, it } from "vitest";
import { buildImagePath } from "../recipeImages";

/**
 * Der Speicherpfad ist kein Detail: die Storage-Policy prüft den ERSTEN
 * Abschnitt gegen die Haushalte des Nutzers. Ein Pfad ohne führende
 * household_id würde entweder abgelehnt — oder, schlimmer, bei einer später
 * gelockerten Policy fremde Bilder sichtbar machen.
 */
describe("buildImagePath", () => {
  const household = "11111111-1111-1111-1111-111111111111";
  const recipe = "22222222-2222-2222-2222-222222222222";

  it("beginnt mit der household_id und dann der recipe_id", () => {
    const path = buildImagePath(household, recipe, "foto.jpg");
    const parts = path.split("/");
    expect(parts[0]).toBe(household);
    expect(parts[1]).toBe(recipe);
    expect(parts).toHaveLength(3);
  });

  it("vergibt für jedes Bild einen eigenen Namen", () => {
    const a = buildImagePath(household, recipe, "foto.jpg");
    const b = buildImagePath(household, recipe, "foto.jpg");
    expect(a).not.toBe(b);
  });

  it.each([
    ["foto.jpg", "jpg"],
    ["FOTO.JPEG", "jpg"],
    ["bild.png", "png"],
    ["bild.webp", "webp"],
    ["IMG_0042.HEIC", "heic"],
  ])("übernimmt die Endung von %s als .%s", (name, extension) => {
    expect(buildImagePath(household, recipe, name).endsWith(`.${extension}`)).toBe(true);
  });

  it("fällt bei fehlender oder unbekannter Endung auf jpg zurück", () => {
    expect(buildImagePath(household, recipe, "ohne-endung").endsWith(".jpg")).toBe(true);
    expect(buildImagePath(household, recipe, "datei.txt").endsWith(".jpg")).toBe(true);
  });

  it("übernimmt keine Zeichen aus dem Dateinamen des Geräts", () => {
    // iOS liefert Namen mit Leerzeichen und Doppelpunkten; im Pfad hätten die
    // nichts zu suchen. Es zählt nur die Endung.
    const path = buildImagePath(household, recipe, "Foto 12:30 Uhr.jpg");
    expect(path).not.toContain(" ");
    expect(path).not.toContain(":");
    expect(path).not.toContain("Foto");
  });

  it("lässt sich nicht mit ../ aus dem Haushalt herausführen", () => {
    const path = buildImagePath(household, recipe, "../../fremd.jpg");
    expect(path).not.toContain("..");
    expect(path.startsWith(`${household}/${recipe}/`)).toBe(true);
  });
});
