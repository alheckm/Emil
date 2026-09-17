import type { SupabaseClient } from "@supabase/supabase-js";
import { authErrorMessage } from "./errors";
import { fail, ok, type Result } from "./result";

/**
 * Anmeldung und Passwort — die eine Schicht, die Supabase Auth kennt.
 *
 * Jede Funktion bekommt den Client übergeben, statt sich selbst einen zu
 * holen. Damit läuft derselbe Code im Browser und auf dem Server, und eine
 * spätere Expo-App reicht einfach ihren eigenen Client herein.
 */

/** `true`, wenn erst noch eine Bestätigungs-E-Mail geöffnet werden muss. */
export interface SignUpOutcome {
  needsConfirmation: boolean;
}

export async function signUp(
  supabase: SupabaseClient,
  email: string,
  password: string,
  redirectTo: string,
): Promise<Result<SignUpOutcome>> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) return fail(authErrorMessage(error));

  // Ist die Adresse schon vergeben, antwortet Supabase absichtlich mit einem
  // Nutzer ohne `identities` statt mit einem Fehler — sonst könnte man über
  // das Registrierformular durchprobieren, wer hier ein Konto hat. Wir
  // übernehmen diese Zurückhaltung und zeigen in beiden Fällen denselben
  // Hinweis aufs Postfach.
  return ok({ needsConfirmation: data.session === null });
}

export async function signIn(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<Result> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  return error ? fail(authErrorMessage(error)) : ok(undefined);
}

export async function signOut(supabase: SupabaseClient): Promise<Result> {
  const { error } = await supabase.auth.signOut();
  return error ? fail(authErrorMessage(error)) : ok(undefined);
}

export async function requestPasswordReset(
  supabase: SupabaseClient,
  email: string,
  redirectTo: string,
): Promise<Result> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  return error ? fail(authErrorMessage(error)) : ok(undefined);
}

export async function setNewPassword(
  supabase: SupabaseClient,
  password: string,
): Promise<Result> {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? fail(authErrorMessage(error)) : ok(undefined);
}
