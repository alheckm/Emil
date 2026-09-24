"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { setDisplayName, uploadAvatar } from "@/lib/data/profiles";
import { Avatar, Button, Field, Notice } from "@/components/ui";
import { PencilIcon } from "@/components/icons";

const MAX_EDGE_PX = 512;
const MAX_SIZE_MB = 0.6;

/**
 * Avatar und Klarname im Konto.
 *
 * Der Name wird über einen eigenen Knopf gespeichert (wie überall sonst in
 * Emil — kein Speichern beim Verlassen des Felds), das Foto sofort beim
 * Auswählen hochgeladen: bei einem Bild gibt es ohnehin nichts abzubrechen,
 * und die Vorschau zeigt sofort, ob die Wahl passt.
 *
 * Kein `capture="environment"` wie bei `RecipeImageField`: dort ist ein
 * Kochbuchfoto meist frisch aufgenommen, hier soll aber genauso oft ein
 * vorhandenes Porträt aus der Mediathek gehen — die Kamera direkt zu
 * erzwingen wäre hier der falsche Vorgriff.
 */
export function AccountProfile({
  userId,
  email,
  initialDisplayName,
  initialAvatarPath,
  initialAvatarUrl,
}: {
  userId: string;
  email: string | null;
  initialDisplayName: string;
  initialAvatarPath: string | null;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const inputId = useId();
  const [name, setName] = useState(initialDisplayName);
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");

  const initial =
    (name.trim() || email || "").charAt(0).toUpperCase() || null;
  const nameChanged = name.trim() !== "" && name.trim() !== initialDisplayName;

  async function saveName() {
    const value = name.trim();
    if (!nameChanged) return;

    setError("");
    setSavingName(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setSavingName(false);
      return;
    }
    const result = await setDisplayName(supabase, userId, value);
    setSavingName(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;

    setError("");
    setUploadingPhoto(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setUploadingPhoto(false);
      return;
    }

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: MAX_EDGE_PX,
        maxSizeMB: MAX_SIZE_MB,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      const asFile = new File([compressed], file.name, { type: "image/jpeg" });
      setPreviewUrl(URL.createObjectURL(asFile));

      const uploaded = await uploadAvatar(supabase, userId, asFile, avatarPath);
      if (!uploaded.ok) {
        setError(uploaded.error);
        setPreviewUrl(null);
        setUploadingPhoto(false);
        return;
      }
      setAvatarPath(uploaded.value);
      setUploadingPhoto(false);
      router.refresh();
    } catch {
      setError("Das Bild ließ sich nicht verarbeiten. Ein anderes versuchen?");
      setUploadingPhoto(false);
    }
  }

  const shownAvatar = previewUrl ?? initialAvatarUrl;

  return (
    <div className="space-y-5">
      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar url={shownAvatar} initial={initial} size={72} />
          <label
            htmlFor={inputId}
            aria-label="Profilfoto ändern"
            className="absolute -right-0.5 -bottom-0.5 flex h-7 w-7 items-center justify-center rounded-full border-[2.5px] border-card bg-accent press-flat"
          >
            <PencilIcon className="h-3.5 w-3.5 text-accent-ink" strokeWidth={2.4} />
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadingPhoto}
            onChange={(event) => void pickPhoto(event.target.files?.[0])}
          />
        </div>

        <p className="min-w-0 truncate font-display text-[17px] font-bold text-text">
          {uploadingPhoto ? "Foto wird hochgeladen" : (email ?? " ")}
        </p>
      </div>

      <div className="space-y-2">
        <Field
          label="Name"
          hint="Wird im Haushalt und bei zugewiesenen Aufgaben angezeigt"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoCapitalize="words"
          maxLength={40}
        />
        <Button
          variant="secondary"
          disabled={!nameChanged}
          loading={savingName}
          onClick={() => void saveName()}
        >
          {savingName ? "Wird gespeichert" : "Namen speichern"}
        </Button>
      </div>
    </div>
  );
}
