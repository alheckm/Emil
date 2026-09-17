"use client";

import { useEffect, useId, useState } from "react";
import imageCompression from "browser-image-compression";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { getRecipeImageUrl } from "@/lib/data/recipeImages";

/**
 * Bild zum Rezept auswählen — Kamera oder Fotomediathek.
 *
 * Das Bild wird nur aufbewahrt und angezeigt, nicht ausgelesen. Ein
 * Kochbuchfoto digitalisierst du in claude.ai und fügst das Ergebnis über den
 * Import ein; hier geht es allein darum, dass die Rezeptkarte ein Bild hat.
 *
 * Verkleinert wird vor dem Hochladen, nicht danach: ein iPhone-Foto wiegt
 * schnell 4 MB, und das kostet beim Hochladen im Supermarkt-WLAN Geduld und im
 * kostenlosen Speicherkontingent unnötig Platz.
 */

/** Was beim Speichern mit dem Bild geschehen soll. */
export type ImageChange =
  | { kind: "keep" }
  | { kind: "replace"; file: File }
  | { kind: "remove" };

const MAX_EDGE_PX = 1568;
const MAX_SIZE_MB = 1.5;

export function RecipeImageField({
  initialPath,
  onChange,
}: {
  initialPath: string | null;
  onChange: (change: ImageChange) => void;
}) {
  const inputId = useId();
  const [existingUrl, setExistingUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Der Bucket ist privat, deshalb braucht auch die Vorschau eine signierte URL.
  useEffect(() => {
    if (!initialPath) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let cancelled = false;
    void getRecipeImageUrl(supabase, initialPath).then((url) => {
      if (!cancelled) setExistingUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [initialPath]);

  // Objekt-URLs der Vorschau wieder freigeben, sonst hält der Tab das Bild fest.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function pick(file: File | undefined) {
    setError("");
    if (!file) return;

    setBusy(true);
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: MAX_EDGE_PX,
        maxSizeMB: MAX_SIZE_MB,
        useWebWorker: true,
        // Einheitlich JPEG: iPhones liefern HEIC, das viele Browser nicht anzeigen.
        fileType: "image/jpeg",
      });
      const asFile = new File([compressed], file.name, { type: "image/jpeg" });

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(asFile));
      setRemoved(false);
      onChange({ kind: "replace", file: asFile });
    } catch {
      setError("Das Bild ließ sich nicht verarbeiten. Ein anderes versuchen?");
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRemoved(true);
    onChange(initialPath ? { kind: "remove" } : { kind: "keep" });
  }

  const shown = previewUrl ?? (removed ? null : existingUrl);

  return (
    <div className="space-y-2">
      <span className="block text-[13px] font-medium text-muted">Bild</span>

      {shown && (
        // Kein next/image: die URL ist signiert und kurzlebig, da bringt der
        // Optimierer nichts und macht nur Ärger mit wechselnden Adressen.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shown}
          alt=""
          className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
        />
      )}

      <div className="flex gap-2">
        <label
          htmlFor={inputId}
          className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-4 text-[15px] font-medium active:opacity-70"
        >
          {busy ? "Wird verkleinert …" : shown ? "Bild ersetzen" : "Bild wählen"}
        </label>
        {shown && (
          <button
            type="button"
            onClick={remove}
            className="min-h-11 rounded-xl border border-border bg-surface px-4 text-[15px] text-muted active:opacity-70"
          >
            Entfernen
          </button>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        // Auf dem iPhone bietet das direkt die Kamera an, ohne den Umweg über
        // die Mediathek.
        capture="environment"
        className="sr-only"
        onChange={(event) => void pick(event.target.files?.[0])}
      />

      {error && <p className="text-[13px] text-accent">{error}</p>}
    </div>
  );
}
