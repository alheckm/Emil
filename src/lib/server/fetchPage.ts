/**
 * Lädt eine Rezeptseite serverseitig.
 *
 * Serverseitig, weil der Browser fremde Seiten wegen CORS nicht lesen darf —
 * und weil hier Zeit, Größe und Ziel begrenzt werden können.
 */

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120 Safari/537.36";

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;

export type FetchPageResult =
  | { ok: true; html: string; finalUrl: string }
  | { ok: false; error: string };

/**
 * Verhindert, dass die App als Sprungbrett ins Innennetz benutzt wird.
 *
 * Die Nutzer sind vertrauenswürdig, aber die URL kommt aus einem Textfeld, und
 * ein Server, der jede Adresse abruft, ist ein Werkzeug, das man nicht
 * bereitstellen muss. Kostet drei Zeilen.
 */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host === "0.0.0.0") return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (host.endsWith(".internal") || host.endsWith(".local")) return true;
  return false;
}

export function validateRecipeUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (isBlockedHost(url.hostname)) return null;
  return url;
}

export async function fetchPage(input: string): Promise<FetchPageResult> {
  const url = validateRecipeUrl(input);
  if (!url) {
    return {
      ok: false,
      error: "Das sieht nicht nach einer gültigen Web-Adresse aus.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Die Seite antwortete mit Fehler ${response.status}.`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("xml")) {
      return {
        ok: false,
        error: "Unter dieser Adresse liegt keine Webseite, sondern " +
          `„${contentType.split(";")[0] || "etwas Unbekanntes"}“.`,
      };
    }

    // Stückweise lesen und bei 2 MB abbrechen: sonst kann eine einzige
    // überladene Seite die Funktion ins Speicherlimit laufen lassen.
    const reader = response.body?.getReader();
    if (!reader) return { ok: false, error: "Die Seite lieferte keinen Inhalt." };

    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        return {
          ok: false,
          error: "Die Seite ist größer als 2 MB und wurde nicht geladen.",
        };
      }
      chunks.push(value);
    }

    const buffer = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }

    // Zeichensatz aus dem Header respektieren — ältere deutsche Rezeptseiten
    // liefern ISO-8859-1, und dann werden aus Umlauten sonst Fragezeichen.
    const charset = contentType.match(/charset=([\w-]+)/i)?.[1] ?? "utf-8";
    let html: string;
    try {
      html = new TextDecoder(charset).decode(buffer);
    } catch {
      html = new TextDecoder("utf-8").decode(buffer);
    }

    return { ok: true, html, finalUrl: response.url || url.toString() };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: "Die Seite hat nicht innerhalb von 10 Sekunden geantwortet." };
    }
    return { ok: false, error: "Die Seite konnte nicht geladen werden." };
  } finally {
    clearTimeout(timeout);
  }
}
