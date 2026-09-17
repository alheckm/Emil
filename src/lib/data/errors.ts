import type { AuthError, PostgrestError } from "@supabase/supabase-js";

/**
 * Fehler in Sätze übersetzen, die man jemandem zeigen kann.
 *
 * Zwei Quellen mit unterschiedlichem Charakter:
 *
 * - **Unsere eigenen Funktionen** (0005_funktionen.sql) melden sich per
 *   `raise exception` mit deutschem Klartext („Dieser Einladungscode ist
 *   abgelaufen"). Postgres kennzeichnet die mit SQLSTATE `P0001`, und nur die
 *   werden unverändert durchgereicht.
 * - **Alles andere** — Verbindungsabbrüche, Constraint-Verletzungen,
 *   Tippfehler im Query — wird zu einem allgemeinen Satz. Eine rohe
 *   Postgres-Meldung hilft dem Nutzer nicht und verrät nebenbei den
 *   Tabellenaufbau.
 *
 * Supabase Auth antwortet auf Englisch und mit stabilen `code`-Werten; die
 * Übersetzung hängt deshalb am Code, nicht am Text.
 */

const GENERIC =
  "Das hat gerade nicht geklappt. Versuch es bitte gleich noch einmal.";

const OFFLINE =
  "Keine Verbindung. Sobald das Netz wieder da ist, klappt es erneut.";

export function dataErrorMessage(error: PostgrestError | null): string {
  if (!error) return GENERIC;
  if (error.code === "P0001") return error.message;
  if (error.code === "42501") {
    return "Dafür fehlt die Berechtigung. Melde dich bitte neu an.";
  }
  return GENERIC;
}

/**
 * Storage-Fehler sind ein eigener Typ (kein PostgrestError) und tragen keine
 * verlässlichen Codes. Unterschieden wird deshalb nur, was den Nutzer wirklich
 * betrifft: zu groß, falscher Typ, oder sonst etwas.
 */
export function storageErrorMessage(error: { message?: string } | null): string {
  const message = error?.message?.toLowerCase() ?? "";
  if (message.includes("exceeded") || message.includes("too large")) {
    return "Das Bild ist zu groß. Versuch es mit einer kleineren Aufnahme.";
  }
  if (message.includes("mime") || message.includes("content type")) {
    return "Dieses Dateiformat wird nicht unterstützt. JPEG oder PNG gehen.";
  }
  if (message.includes("exists")) {
    return "Unter diesem Namen liegt schon eine Datei. Versuch es noch einmal.";
  }
  return GENERIC;
}

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "E-Mail-Adresse oder Passwort stimmt nicht.",
  email_not_confirmed:
    "Diese Adresse ist noch nicht bestätigt. Schau in dein Postfach — dort " +
    "liegt die Bestätigungs-E-Mail.",
  user_already_exists: "Für diese Adresse gibt es schon ein Konto.",
  email_exists: "Für diese Adresse gibt es schon ein Konto.",
  weak_password:
    "Das Passwort ist zu kurz. Mindestens acht Zeichen, gern ein ganzer Satz.",
  same_password: "Das ist dein bisheriges Passwort. Wähl bitte ein anderes.",
  over_email_send_rate_limit:
    "Zu viele E-Mails in kurzer Zeit. Warte bitte eine Minute.",
  over_request_rate_limit:
    "Zu viele Versuche in kurzer Zeit. Warte bitte eine Minute.",
  validation_failed: "Die Eingabe ist unvollständig.",
  session_expired:
    "Die Sitzung ist abgelaufen. Melde dich bitte noch einmal an.",
  otp_expired:
    "Dieser Link ist abgelaufen. Fordere bitte einen neuen an.",
};

export function authErrorMessage(error: AuthError | null): string {
  if (!error) return GENERIC;
  if (error.code && AUTH_MESSAGES[error.code]) return AUTH_MESSAGES[error.code];

  // Netzwerkfehler haben keinen Code, aber einen eigenen Namen.
  if (error.name === "AuthRetryableFetchError") return OFFLINE;

  return GENERIC;
}
