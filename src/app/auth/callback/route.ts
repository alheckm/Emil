import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/server/supabase";

/**
 * Landepunkt aller E-Mail-Links (Bestätigung und Passwort-Zurücksetzen).
 *
 * Supabase prüft den Link selbst und schickt den Browser anschließend mit
 * `?code=…` hierher. Dieser Code wird gegen eine echte Sitzung getauscht, und
 * erst dabei entstehen die Cookies — deshalb muss das im Route Handler
 * passieren und nicht im Browser: eine Server-Komponente darf keine Cookies
 * setzen.
 *
 * Der Tausch braucht den `code_verifier`, den der Browser beim Absenden des
 * Formulars abgelegt hat. Wer die E-Mail auf einem anderen Gerät öffnet als
 * dem, auf dem er sich registriert hat, hat ihn nicht — daher die ausdrückliche
 * Meldung statt eines stillen Fehlschlags.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase meldet abgelaufene oder schon benutzte Links über die Adresse.
  const supabaseError = searchParams.get("error_description") ?? searchParams.get("error");
  if (supabaseError) {
    return NextResponse.redirect(
      `${origin}/anmelden?fehler=${encodeURIComponent(
        "Dieser Link ist abgelaufen oder wurde schon benutzt. Fordere bitte einen neuen an.",
      )}`,
    );
  }

  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/anmelden`);

  // Nur eigene Pfade: ein „next", das irgendwohin zeigen darf, ist eine
  // offene Weiterleitung — bequemes Material für Phishing-Mails, die
  // scheinbar von uns kommen. `//host` sähe wie ein Pfad aus, ist aber einer
  // auf eine fremde Domain.
  const requested = searchParams.get("next") ?? "/";
  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.redirect(`${origin}/anmelden`);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/anmelden?fehler=${encodeURIComponent(
        "Der Link ließ sich nicht einlösen. Das passiert, wenn die E-Mail auf " +
          "einem anderen Gerät geöffnet wird als dem, auf dem du die Adresse " +
          "eingegeben hast. Fordere den Link bitte auf diesem Gerät neu an.",
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
