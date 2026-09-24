"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { removeAvatar, setDisplayName, uploadAvatar } from "@/lib/data/profiles";
import { Avatar, Button, Field, Notice, SectionEyebrow } from "@/components/ui";

const MAX_EDGE_PX = 512;
const MAX_SIZE_MB = 0.6;

/**
 * „Profil bearbeiten" (DESIGN.md „Konto"): Avatar, Klarname, E-Mail — eigener
 * Screen statt Teil des Konto-Hubs, seit der Hub selbst nur noch Zeilen und
 * die Kopfzeile zeigt.
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
  const [removed, setRemoved] = useState(false);
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
      setRemoved(false);

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

  async function removePhoto() {
    if (!avatarPath) return;

    setError("");
    setUploadingPhoto(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setUploadingPhoto(false);
      return;
    }

    const result = await removeAvatar(supabase, userId, avatarPath);
    setUploadingPhoto(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAvatarPath(null);
    setPreviewUrl(null);
    setRemoved(true);
    router.refresh();
  }

  const shownAvatar = previewUrl ?? (removed ? null : initialAvatarUrl);

  return (
    <div className="space-y-6">
      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <label
          htmlFor={inputId}
          aria-label="Profilfoto ändern"
          className="block shrink-0 rounded-full press-flat tap-target"
        >
          <Avatar url={shownAvatar} initial={initial} size={96} />
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploadingPhoto}
          onChange={(event) => void pickPhoto(event.target.files?.[0])}
        />

        <label
          htmlFor={inputId}
          className="min-h-11 px-2 text-[14px] font-semibold text-text press-flat tap-target"
        >
          {uploadingPhoto ? "Foto wird hochgeladen" : "Foto ändern"}
        </label>
        {shownAvatar && !uploadingPhoto && (
          <button
            type="button"
            onClick={() => void removePhoto()}
            className="min-h-11 px-2 text-[13px] text-muted press-flat tap-target"
          >
            Foto entfernen
          </button>
        )}
      </div>

      <Field
        label="Name"
        hint="Wird im Haushalt und bei zugewiesenen Aufgaben angezeigt"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoCapitalize="words"
        maxLength={40}
      />

      <div className="space-y-2">
        <SectionEyebrow>E-Mail</SectionEyebrow>
        <p className="text-[15px] text-muted">{email ?? "—"}</p>
      </div>

      <Button
        disabled={!nameChanged}
        loading={savingName}
        onClick={() => void saveName()}
      >
        {savingName ? "Wird gespeichert" : "Speichern"}
      </Button>
    </div>
  );
}
