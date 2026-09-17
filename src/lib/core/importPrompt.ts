import { UNITS } from "./units";

/**
 * Der Prompt, den der Import-Screen in die Zwischenablage legt.
 *
 * Zweck: du legst ihn mit dem Foto in claude.ai, kopierst das JSON zurück und
 * fügst es in Emil ein. Dadurch braucht Emil keinen API-Key und verursacht
 * keine laufenden Kosten — der Preis ist dieser eine Handgriff.
 *
 * Die Anweisungen sind bewusst streng: nichts umrechnen, nichts dazuerfinden,
 * Unklares weglassen. Eine fehlende Menge siehst du im Prüf-Screen sofort;
 * eine erfundene fällt dir erst im Supermarkt auf.
 */

const KNOWN_UNITS = UNITS.map((u) => u.code).join(", ");

export const IMPORT_PROMPT = `Lies das Rezept aus dem Bild (oder aus dem folgenden Text) und gib es **ausschließlich** als JSON in genau diesem Format zurück — kein erklärender Text davor oder danach:

{
  "title": "Rindergulasch, klassisch",
  "servings": 4,
  "servings_label": "Portionen",
  "ingredients": [
    { "amount": 15, "unit": "g",     "name": "Butterschmalz" },
    { "amount": 2,  "unit": "Stück", "name": "Zwiebel", "note": "groß, gewürfelt" },
    { "amount": 2,  "unit": "EL",    "name": "Tomatenmark" },
    { "name": "Salz und Pfeffer" }
  ],
  "instructions": ["Butterschmalz erhitzen und das Fleisch anbraten.", "…"]
}

Regeln:
1. Mengen genau so übernehmen, wie sie abgedruckt sind. Nichts umrechnen, nicht runden, nicht auf andere Portionszahlen hochrechnen.
2. Steht keine Menge da ("Salz und Pfeffer", "etwas Öl"), lass "amount" und "unit" einfach weg. Nichts schätzen.
3. Bei "etwas", "nach Geschmack" oder "n. B." zusätzlich "to_taste": true setzen.
4. Bei Angaben wie "2-3 Zwiebeln": "amount": 2 und "amount_max": 3.
5. Brüche als Dezimalzahl: ½ wird 0.5, 1½ wird 1.5.
6. Für "unit" bevorzugt eine dieser Schreibweisen verwenden: ${KNOWN_UNITS}. Passt keine, schreib die Einheit hin, wie sie im Rezept steht.
7. Zubereitungshinweise wie "gewürfelt", "groß" oder "zimmerwarm" gehören in "note", nicht in "name".
8. Wörter, die ein anderes Produkt bezeichnen, gehören in "name": "getrocknete Tomaten" und "gemahlener Kreuzkümmel" bleiben vollständig im Namen.
9. "servings" ist die Portionszahl, für die die Mengen im Rezept gelten. Steht sie nicht da, lass das Feld weg.
10. Kannst du eine Zeile nicht sicher lesen, nimm sie mit dem Text auf, den du erkennst, und lass unsichere Felder weg.`;

/** Kurzfassung für den Hinweistext neben dem Knopf. */
export const IMPORT_PROMPT_HINT =
  "Prompt kopieren, in claude.ai zusammen mit dem Foto einfügen, " +
  "die JSON-Antwort kopieren und hier einsetzen.";
