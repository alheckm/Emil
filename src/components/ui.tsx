/**
 * Die paar Bausteine, aus denen alle Formulare bestehen.
 *
 * Bewusst klein gehalten und ohne Bibliothek: Emil hat eine Handvoll Screens,
 * und ein Design-System für zwei Nutzer wäre mehr Pflege als Nutzen.
 *
 * Anatomie und Zustände folgen dem Komponenten-Specimen der Maison-Augé-
 * Richtung (HANDOFF-maison-auge.md): Buttons sind rechteckige Flächen statt
 * Pillen, Textfelder ein Unterstrich statt ein Kasten, Notices ein Rahmen in
 * Tonfarbe statt eine gefüllte Fläche. Zwei Maße stehen trotzdem nicht
 * zufällig, unabhängig von der Design-Richtung:
 * - Eingabefelder haben mindestens 16 px Schrift. Darunter zoomt iOS Safari
 *   beim Antippen ins Feld hinein und der Screen sitzt schief.
 * - Interaktive Flächen sind mindestens 44 px hoch — Apples Mindestgröße für
 *   etwas, das man mit dem Daumen trifft, und die App wird im Supermarkt
 *   einhändig bedient. Fließtext (Notices) bleibt bei mindestens 15 px.
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Ein Block, der inhaltlich zusammengehört — mehr nicht.
 *
 * Keine eigene Optik: kein Hintergrund, keine Rundung, kein Schatten. Auf
 * `--bg` trägt allein Weißraum die Trennung. Bedienflächen, die eine Fläche
 * brauchen, nehmen `--soft`, nie `--card` — `--card` fällt in dieser Richtung
 * mit `--bg` zusammen.
 */
export function Section({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

/**
 * Textfeld — Unterstrich statt Kasten, Label darüber in Überschrift-Skala.
 */
export function Field({
  label,
  hint,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-extrabold tracking-[0.08em] text-muted uppercase">
        {label}
      </span>
      <input
        {...props}
        className={
          "mt-1.5 block h-11 w-full border-0 border-b-2 border-text bg-transparent px-0 text-base " +
          "font-semibold text-text outline-none placeholder:text-muted/50 " +
          "focus:border-b-[3px] " +
          className
        }
      />
      {hint && (
        <span className="mt-1.5 block text-[13px] text-muted">{hint}</span>
      )}
    </label>
  );
}

/**
 * Buttons — rechteckig, Versal-Label, gesperrt. Vier Rollen:
 * Primär (Fläche), Sekundär (Kontur), Tertiär (Text + „→", kein Rahmen),
 * Destruktiv (Kontur in `--danger`). Nur ein Primärbutton pro Screen.
 */
export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  loading?: boolean;
}) {
  if (variant === "tertiary") {
    return (
      <button
        {...props}
        disabled={disabled}
        className={
          "inline-flex min-h-11 items-center gap-1.5 text-[13px] font-extrabold tracking-[0.1em] text-text uppercase " +
          "press-flat tap-target disabled:cursor-not-allowed disabled:opacity-30 " +
          className
        }
      >
        {children}
      </button>
    );
  }

  const look = {
    primary: "bg-accent text-accent-ink",
    secondary: "border-2 border-text text-text active:bg-text/8",
    danger: "border-2 border-danger text-danger active:bg-danger-tint",
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={
        "inline-flex h-13 w-full items-center justify-center gap-2.5 px-6 " +
        "text-[13px] font-extrabold tracking-[0.1em] uppercase press " +
        "disabled:cursor-not-allowed disabled:opacity-30 " +
        look +
        " " +
        className
      }
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current/35 border-t-current motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  );
}

/**
 * Meldung über einem Formular.
 *
 * Gerahmt statt gefüllt — Fläche bleibt `--bg`/`--card` (dieselbe Fläche in
 * dieser Richtung), nur der Rahmen und der Text tragen die Tonfarbe.
 *
 * `role="alert"` ist kein Beiwerk: ohne die Ansage liest VoiceOver einen
 * Fehler, der nach dem Absenden erscheint, schlicht nicht vor — der Nutzer
 * wartet dann auf etwas, das längst da ist.
 */
export function Notice({
  tone,
  children,
}: {
  tone: "error" | "ok" | "info";
  children: ReactNode;
}) {
  const look = {
    error: "border-danger text-danger",
    ok: "border-ok text-ok",
    info: "border-text text-text",
  }[tone];

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={"border px-4 py-3 text-[15px] leading-relaxed font-medium " + look}
    >
      {children}
    </p>
  );
}

/**
 * Überschrift eines Screens.
 *
 * `size="display"` ist die Riesenversalie der vier Root-Tab-Screens
 * (Rezeptübersicht, Einkaufsliste, Todo, Einstellungen) — `hyphens: auto`
 * bewahrt sie vor langen Wörtern, die bei 56 px über den Rand laufen.
 * `size="title"` (Vorgabe) ist die kleinere Skala für Formulare, Detail- und
 * Unterseiten. Steht als eigener Baustein daneben, weil der Titel nicht
 * immer im Voraus feststeht: beim Rezept kommt er aus den Daten und darf
 * deshalb erst erscheinen, wenn diese da sind — also innerhalb der
 * Suspense-Grenze, nicht im statischen Rahmen darum.
 */
export function ScreenHeader({
  title,
  lead,
  action,
  size = "title",
}: {
  title: ReactNode;
  lead?: ReactNode;
  /**
   * Etwas rechts neben der Überschrift — in der Praxis der Zugang zu den
   * Einstellungen.
   *
   * Als Slot und nicht fest eingebaut, weil er nur auf die beiden Haupt-Tabs
   * gehört. Auf einem Rezept oder in einem Formular steht oben ein Weg zurück,
   * und zwei konkurrierende Ziele an derselben Ecke wären eine Falle.
   */
  action?: ReactNode;
  size?: "display" | "title";
}) {
  return (
    <header>
      <div className="flex items-start justify-between gap-4">
        <h1
          lang="de"
          className={
            "font-display font-black text-text uppercase [hyphens:auto] " +
            (size === "display"
              ? "text-[56px] leading-[1.02] tracking-[-0.01em]"
              : "text-[28px] leading-[1.05] tracking-[-0.005em]")
          }
        >
          {title}
        </h1>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>
      {lead && (
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{lead}</p>
      )}
    </header>
  );
}

/**
 * Rahmen für alles unterhalb des Logins: eine Spalte, Daumenbreite.
 *
 * `title` ist absichtlich optional. Der Rahmen selbst ist statisch und landet
 * damit in der App Shell — er steht also schon, bevor irgendwelche Daten da
 * sind. Screens, deren Titel erst aus den Daten kommt, lassen ihn hier weg und
 * setzen stattdessen drinnen einen `ScreenHeader`.
 */
export function Screen({
  title,
  lead,
  action,
  titleSize,
  bleed,
  children,
}: {
  title?: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  titleSize?: "display" | "title";
  /**
   * Nimmt dem Rahmen Seitenrand und Abstand nach oben.
   *
   * Für den einen Screen, auf dem ein Foto bis an den Bildschirmrand läuft und
   * unter der Statusleiste beginnt — so steht es im Entwurf. Die Abschnitte
   * darunter setzen ihren Seitenrand dann selbst.
   */
  bleed?: boolean;
  children: ReactNode;
}) {
  return (
    <main className={"flex-1 pb-safe " + (bleed ? "" : "px-safe pt-safe")}>
      <div
        className={
          "mx-auto w-full max-w-md " + (bleed ? "" : "space-y-8 py-8")
        }
      >
        {title !== undefined && (
          <ScreenHeader
            title={title}
            lead={lead}
            action={action}
            size={titleSize}
          />
        )}
        <div className={bleed ? "" : "space-y-6"}>{children}</div>
      </div>
    </main>
  );
}

export function Select({
  label,
  hint,
  className = "",
  children,
  ...props
}: ComponentProps<"select"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-extrabold tracking-[0.08em] text-muted uppercase">
        {label}
      </span>
      <select
        {...props}
        className={
          "mt-1.5 block h-11 w-full appearance-none border-0 border-b-2 border-text " +
          "bg-transparent px-0 text-base font-semibold text-text outline-none " +
          "focus:border-b-[3px] " +
          className
        }
      >
        {children}
      </select>
      {hint && (
        <span className="mt-1.5 block text-[13px] text-muted">{hint}</span>
      )}
    </label>
  );
}

export function Textarea({
  label,
  hint,
  className = "",
  ...props
}: ComponentProps<"textarea"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-extrabold tracking-[0.08em] text-muted uppercase">
        {label}
      </span>
      <textarea
        {...props}
        className={
          "mt-1.5 block w-full border-0 border-b-2 border-text bg-transparent px-0 py-2 " +
          "text-base font-semibold text-text outline-none placeholder:text-muted/50 " +
          "focus:border-b-[3px] " +
          className
        }
      />
      {hint && (
        <span className="mt-1.5 block text-[13px] text-muted">{hint}</span>
      )}
    </label>
  );
}

/**
 * Zeile einer Liste, die auf einen Bildschirm führt.
 *
 * Als eigener Baustein, weil die Trefferfläche sonst je nach Screen anders
 * ausfällt — und im Supermarkt wird einhändig und in Bewegung getippt.
 */
export function RowLink({
  href,
  children,
  prefetch,
}: {
  href: string;
  children: ReactNode;
  /**
   * Holt zusätzlich die URL-abhängigen Inhalte des Ziels vorab.
   *
   * Ohne das lädt ein `<Link>` nur die App Shell der Zielroute — alles, was an
   * `params` hängt, kommt erst nach dem Klick. Mit `prefetch` ist auch das
   * schon da. Der Preis ist eine Server-Runde pro sichtbarem Verweis, also
   * gehört das an überschaubare Listen und nicht an jede Zeile.
   */
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className="flex min-h-14 items-center justify-between gap-3 bg-soft px-4 py-3 text-[15px] press tap-target"
    >
      <span className="min-w-0">{children}</span>
      <span aria-hidden className="shrink-0 text-muted">
        ›
      </span>
    </Link>
  );
}
