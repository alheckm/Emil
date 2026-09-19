"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

/**
 * Ausschnitt eines Fotos wählen — fest auf 4:3, wie Karte, Hero und
 * `RecipeImageField` das Bild ohnehin immer per `object-cover` zeigen. Ohne
 * feste Kante würde die Anzeige den gewählten Ausschnitt hinterher nur wieder
 * überschreiben.
 *
 * Zoom ist relativ: 1 deckt gerade den Rahmen ab ("cover"), bis 3. Die
 * absolute Bildgröße wird bei jeder Interaktion frisch aus der gemessenen
 * Rahmengröße abgeleitet statt einmalig zwischengespeichert — sonst driftet
 * sie bei einer Drehung des Geräts auseinander.
 *
 * Ein Regler statt einer Zwei-Finger-Geste: Emil wird einhändig bedient, und
 * ein Regler bleibt zusätzlich mit der Tastatur bedienbar (Abschnitt 11).
 *
 * Zoom und Verschiebung beginnen bei jeder Sitzung neu — dafür sorgt kein
 * Reset-Effekt, sondern der Aufrufer über `key={src}`, ein frisches Bild ist
 * also ein frisches Mount.
 */
export function ImageCropper({
  src,
  onCancel,
  onConfirm,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [frameSize, setFrameSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setFrameSize({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const coverScale =
    frameSize && natural
      ? Math.max(frameSize.w / natural.w, frameSize.h / natural.h)
      : null;
  const scale = coverScale ? coverScale * zoom : null;
  const ready = Boolean(natural && frameSize && scale);

  function clamp(next: { x: number; y: number }, s: number) {
    if (!natural || !frameSize) return next;
    const dw = natural.w * s;
    const dh = natural.h * s;
    const maxX = Math.max(0, (dw - frameSize.w) / 2);
    const maxY = Math.max(0, (dh - frameSize.h) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function handleLoad() {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!scale) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !scale) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setOffset(
      clamp(
        { x: dragRef.current.offsetX + dx, y: dragRef.current.offsetY + dy },
        scale,
      ),
    );
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onZoom(next: number) {
    setZoom(next);
    const nextScale = coverScale ? coverScale * next : null;
    if (nextScale) setOffset((prev) => clamp(prev, nextScale));
  }

  async function confirm() {
    if (!natural || !frameSize || !scale || !imgRef.current) return;
    setBusy(true);
    try {
      const cropW = frameSize.w / scale;
      const cropH = frameSize.h / scale;
      const cropX = Math.min(
        Math.max(natural.w / 2 - cropW / 2 - offset.x / scale, 0),
        natural.w - cropW,
      );
      const cropY = Math.min(
        Math.max(natural.h / 2 - cropH / 2 - offset.y / scale, 0),
        natural.h - cropH,
      );

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(cropW);
      canvas.height = Math.round(cropH);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(
        imgRef.current,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (blob) onConfirm(blob);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        ref={frameRef}
        className="relative aspect-[4/3] w-full touch-none overflow-hidden rounded-soft bg-soft"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={handleLoad}
          className="absolute left-1/2 top-1/2 max-w-none select-none"
          style={
            natural && scale
              ? {
                  width: natural.w * scale,
                  height: natural.h * scale,
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                }
              : { opacity: 0 }
          }
        />
      </div>

      <input
        type="range"
        className="zoom-slider"
        aria-label="Ausschnitt vergrößern"
        min={1}
        max={3}
        step={0.01}
        value={zoom}
        onChange={(event) => onZoom(Number(event.target.value))}
        disabled={!ready}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-11 flex-1 items-center justify-center rounded-pill border border-border px-4 text-[15px] text-muted press"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={!ready || busy}
          className="flex min-h-11 flex-1 items-center justify-center rounded-pill bg-accent px-4 text-[15px] font-medium text-accent-ink press disabled:opacity-50"
        >
          {busy ? "Wird zugeschnitten …" : "Übernehmen"}
        </button>
      </div>
    </div>
  );
}
