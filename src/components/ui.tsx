/**
 * Die paar Bausteine, aus denen alle Formulare bestehen.
 *
 * Bewusst klein gehalten und ohne Bibliothek: Emil hat eine Handvoll Screens,
 * und ein Design-System für zwei Nutzer wäre mehr Pflege als Nutzen.
 *
 * Zwei Maße stehen hier nicht zufällig:
 * - Eingabefelder haben mindestens 16 px Schrift. Darunter zoomt iOS Safari
 *   beim Antippen ins Feld hinein und der Screen sitzt schief.
 * - Knöpfe und Felder sind mindestens 44 px hoch — Apples Mindestgröße für
 *   etwas, das man mit dem Daumen trifft, und die App wird im Supermarkt
 *   einhändig bedient.
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Ein Block, der inhaltlich zusammengehört — mehr nicht.
 *
 * Keine eigene Optik: kein Hintergrund, keine Rundung, kein Schatten. Auf
 * `--bg` trägt allein Weißraum die Trennung (design-system.md, Abschnitt 4,
 * Regel 1). Die einzige Fläche mit eigenem Körper — Karte, Radius, Schatten —
 * ist `--card`, und die gehört ausschließlich der Rezeptvorschau in der
 * Übersicht (`RecipeBrowser.tsx`), nicht diesem Baustein.
 */
export function Section({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function Field({
  label,
  hint,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <input
        {...props}
        className={
          "mt-1 block h-12 w-full rounded-soft border border-border bg-soft px-4 text-base " +
          "text-text outline-none placeholder:text-muted/60 " +
          "focus:border-text " +
          className
        }
      />
      {hint && <span className="mt-1 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

export function Button({
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "quiet" | "danger" }) {
  const look = {
    primary: "bg-accent text-accent-ink",
    quiet: "border border-border text-text",
    danger: "border border-danger text-danger",
  }[variant];

  return (
    <button
      {...props}
      className={
        // Vollrunde Pille statt abgerundetem Rechteck — die auffälligste Form
        // in KptnCooks Auftritt nach der Slab-Serife.
        "inline-flex h-12 w-full items-center justify-center rounded-pill px-5 " +
        "text-base font-medium press " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        look
      }
    />
  );
}

/**
 * Meldung über einem Formular.
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
    error: "border-danger/40 bg-danger/10 text-text",
    ok: "border-ok/40 bg-ok/10 text-text",
    info: "border-border bg-soft text-muted",
  }[tone];

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={"rounded-soft border px-4 py-3 text-[15px] leading-relaxed " + look}
    >
      {children}
    </p>
  );
}

/**
 * Überschrift eines Screens.
 *
 * Steht als eigener Baustein daneben, weil der Titel nicht immer im Voraus
 * feststeht: beim Rezept kommt er aus den Daten und darf deshalb erst
 * erscheinen, wenn diese da sind — also innerhalb der Suspense-Grenze, nicht
 * im statischen Rahmen darum.
 */
export function ScreenHeader({
  title,
  lead,
  action,
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
}) {
  return (
    <header>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-[26px] font-bold leading-[1.2]">
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
  bleed,
  children,
}: {
  title?: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
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
          <ScreenHeader title={title} lead={lead} action={action} />
        )}
        <div className={bleed ? "" : "space-y-6"}>{children}</div>
      </div>
    </main>
  );
}

export function Select({
  label,
  className = "",
  children,
  ...props
}: ComponentProps<"select"> & { label: string }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <select
        {...props}
        className={
          "mt-1 block h-12 w-full appearance-none rounded-soft border border-border " +
          "bg-soft px-4 text-base text-text outline-none " +
          "focus:border-text " +
          className
        }
      >
        {children}
      </select>
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
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <textarea
        {...props}
        className={
          "mt-1 block w-full rounded-soft border border-border bg-soft p-4 text-base " +
          "text-text outline-none placeholder:text-muted/60 " +
          "focus:border-text " +
          className
        }
      />
      {hint && <span className="mt-1 block text-[13px] text-muted">{hint}</span>}
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
      className="flex min-h-14 items-center justify-between gap-3 rounded-soft bg-soft px-4 py-3 text-[15px] press tap-target"
    >
      <span className="min-w-0">{children}</span>
      <span aria-hidden className="shrink-0 text-muted">
        ›
      </span>
    </Link>
  );
}
