import { NextResponse } from "next/server";
import { z } from "zod";
import { extractRecipeFromHtml } from "@/lib/core/extractRecipeFromHtml";
import { fetchPage } from "@/lib/server/fetchPage";
import { SUPABASE_MISSING_MESSAGE, getSupabaseConfig } from "@/lib/server/env";
import { getCurrentUser } from "@/lib/server/supabase";

/**
 * POST /api/v1/import/url  →  Rezeptentwurf aus einer Webseite.
 *
 * Als HTTP-Route und nicht als Server Action, weil Architektur-Leitregel 5 das
 * verlangt: der iOS-Kurzbefehl (P7) und ein späterer nativer Client müssen sie
 * aufrufen können.
 *
 * Gibt nur einen Entwurf zurück und schreibt nichts — gespeichert wird erst
 * nach dem Prüf-Screen.
 */

const Body = z.object({ url: z.string().min(1, "Adresse fehlt") });

export async function POST(request: Request) {
  if (!getSupabaseConfig()) {
    return NextResponse.json({ error: SUPABASE_MISSING_MESSAGE }, { status: 503 });
  }

  // Angemeldet sein ist Pflicht: sonst wäre das ein offener Abruf-Dienst,
  // über den Fremde beliebige Seiten durch unseren Server laden könnten.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Es wurde keine Adresse übergeben." },
      { status: 400 },
    );
  }

  const page = await fetchPage(parsed.data.url);
  if (!page.ok) {
    return NextResponse.json({ error: page.error }, { status: 422 });
  }

  const result = extractRecipeFromHtml(page.html);
  if (!result) {
    return NextResponse.json(
      {
        error:
          "Auf dieser Seite war kein Rezept in maschinenlesbarer Form zu finden. " +
          "Du kannst den Text stattdessen kopieren und über „Text einfügen“ importieren.",
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    source: result.source,
    sourceUrl: page.finalUrl,
    recipe: result.recipe,
  });
}
