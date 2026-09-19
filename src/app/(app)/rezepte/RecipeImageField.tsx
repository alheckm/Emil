"use client";

import { useEffect, useId, useState } from "react";
import imageCompression from "browser-image-compression";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { getRecipeImageUrl } from "@/lib/data/recipeImages";
import { ImageCropper } from "./ImageCropper";

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
  const [cropLoading, setCropLoading] = useState(false);
  const [error, setError] = useState("");
  // Objekt-URL des Bildes, das gerade im Zuschnitt-Werkzeug offen ist — sonst
  // nichts geöffnet.
  const [cropSrc, setCropSrc] = useState<string | null>(null);

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

  // Dasselbe für die Objekt-URL im Zuschnitt-Werkzeug — auch wenn der Nutzer
  // mittendrin die Seite verlässt statt "Abbrechen" oder "Übernehmen" zu
  // tippen.
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

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
      // Erst der Zuschnitt, dann die Vorschau — direkt nach der Aufnahme soll
      // der Ausschnitt gewählt werden, nicht erst nachträglich über den
      // separaten Knopf.
      setCropSrc(URL.createObjectURL(asFile));
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

  // Das aktuell gezeigte Bild erneut zuschneiden — egal ob frisch aufgenommen
  // (previewUrl, bereits eine Objekt-URL) oder das gespeicherte Bild
  // (existingUrl, signiert). Beide gehen über fetch(): eine Objekt-URL ist
  // schon lokal, eine signierte holt sich so ihre Bilddaten, ohne dass das
  // spätere Canvas als "verunreinigt" gilt (kein <img crossOrigin>-Umweg
  // nötig, weil aus dem Blob eine eigene Objekt-URL entsteht).
  async function openCrop() {
    const url = shown;
    if (!url) return;
    setError("");
    setCropLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Bild nicht erreichbar");
      const blob = await response.blob();
      setCropSrc(URL.createObjectURL(blob));
    } catch {
      setError("Das Bild ließ sich nicht laden.");
    } finally {
      setCropLoading(false);
    }
  }

  function closeCrop() {
    setCropSrc(null);
  }

  function applyCrop(blob: Blob) {
    const asFile = new File([blob], "rezept.jpg", { type: "image/jpeg" });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(asFile));
    setRemoved(false);
    onChange({ kind: "replace", file: asFile });
    closeCrop();
  }

  const shown = previewUrl ?? (removed ? null : existingUrl);

  return (
    <div className="space-y-2">
      <span className="block text-[13px] font-medium text-muted">Bild</span>

      {cropSrc ? (
        <ImageCropper
          // Jede Zuschnitt-Sitzung bekommt eine frische Objekt-URL — der Key
          // sorgt dafür, dass Zoom und Verschiebung dabei neu beginnen, statt
          // vom vorigen Bild übrig zu bleiben.
          key={cropSrc}
          src={cropSrc}
          onCancel={closeCrop}
          onConfirm={applyCrop}
        />
      ) : (
        <>
          {shown && (
            // Kein next/image: die URL ist signiert und kurzlebig, da bringt
            // der Optimierer nichts und macht nur Ärger mit wechselnden
            // Adressen.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt=""
              className="aspect-[4/3] w-full rounded-soft object-cover"
            />
          )}

          <div className="flex gap-2">
            <label
              htmlFor={inputId}
              className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-pill border border-border px-4 text-[15px] font-medium press"
            >
              {busy
                ? "Wird verkleinert …"
                : shown
                  ? "Bild ersetzen"
                  : "Bild wählen"}
            </label>
          </div>

          {shown && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void openCrop()}
                disabled={cropLoading}
                className="flex min-h-11 flex-1 items-center justify-center rounded-pill border border-border px-4 text-[15px] text-muted press disabled:opacity-50"
              >
                {cropLoading ? "Wird geladen …" : "Zuschneiden"}
              </button>
              <button
                type="button"
                onClick={remove}
                className="flex min-h-11 flex-1 items-center justify-center rounded-pill border border-border px-4 text-[15px] text-muted press"
              >
                Entfernen
              </button>
            </div>
          )}
        </>
      )}

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

      {error && <p className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}
