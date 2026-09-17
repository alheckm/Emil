import { NextResponse } from "next/server";
import {
  SECRET_KEY_MISSING_MESSAGE,
  SUPABASE_MISSING_MESSAGE,
  getSupabaseConfig,
} from "@/lib/server/env";
import { getServerSupabase } from "@/lib/server/supabase";
import { getAdminSupabase } from "@/lib/server/supabaseAdmin";

/**
 * DELETE /api/v1/account  →  Konto und alle eigenen Daten löschen.
 *
 * Apple verlangt das für jede App mit Registrierung; die DSGVO ohnehin.
 *
 * Zwei Schritte, und die Reihenfolge ist wichtig:
 *
 * 1. `delete_own_household_data()` **im Nutzerkontext**. Die Funktion räumt
 *    die Mitgliedschaft weg und den Haushalt gleich mit, wenn danach niemand
 *    mehr darin ist — per Kaskade samt Rezepten, Listen und Bildpfaden. Sie
 *    läuft bewusst als der Nutzer, damit sie nur dessen eigene Haushalte
 *    anfassen kann.
 * 2. Erst dann der Eintrag in `auth.users`, und nur dafür der Secret Key.
 *
 * Andersherum bliebe bei einem Abbruch zwischen den Schritten ein Haushalt
 * ohne Besitzer zurück, an den niemand mehr herankommt. So bleibt im
 * schlimmsten Fall ein Konto ohne Daten übrig — das kann man erneut löschen.
 *
 * Als HTTP-Route und nicht als Server Action, weil Architektur-Leitregel 5 das
 * verlangt: ein späterer nativer Client muss sie aufrufen können.
 */
export async function DELETE() {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: SUPABASE_MISSING_MESSAGE }, { status: 503 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: SUPABASE_MISSING_MESSAGE }, { status: 503 });
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  // Vor dem ersten Schritt prüfen, nicht danach: sonst wären die Daten weg und
  // das Konto bliebe stehen.
  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json(
      { error: SECRET_KEY_MISSING_MESSAGE },
      { status: 503 },
    );
  }

  const { error: cleanupError } = await supabase.rpc("delete_own_household_data");
  if (cleanupError) {
    return NextResponse.json(
      { error: "Die Daten konnten nicht gelöscht werden. Bitte versuch es erneut." },
      { status: 500 },
    );
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json(
      {
        error:
          "Die Daten sind gelöscht, das Konto selbst nicht. Bitte versuch es " +
          "noch einmal — beim zweiten Anlauf bleibt nichts übrig.",
      },
      { status: 500 },
    );
  }

  // Das Sitzungs-Cookie zeigt jetzt auf einen Nutzer, den es nicht mehr gibt.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
