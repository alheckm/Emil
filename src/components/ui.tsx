/**
 * Die paar Bausteine, aus denen alle Formulare bestehen.
 *
 * Bewusst klein gehalten und ohne Bibliothek: Emil hat eine Handvoll Screens,
 * und ein Design-System für zwei Nutzer wäre mehr Pflege als Nutzen.
 *
 * Anatomie und Zustände folgen dem Komponenten-Specimen der
 * Instagram-Baseline-Richtung (DESIGN.md): Buttons sind schwarze Pillen,
 * Textfelder gerundete Kästen auf `--soft`, Notices eine getönte Fläche statt
 * eines Rahmens. Zwei Maße stehen trotzdem nicht zufällig, unabhängig von der
 * Design-Richtung:
 * - Eingabefelder haben mindestens 16 px Schrift. Darunter zoomt iOS Safari
 *   beim Antippen ins Feld hinein und der Screen sitzt schief.
 * - Interaktive Flächen sind mindestens 44 px hoch — Apples Mindestgröße für
 *   etwas, das man mit dem Daumen trifft, und die App wird im Supermarkt
 *   einhändig bedient. Fließtext (Notices) bleibt bei mindestens 15 px.
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronRightIcon } from "./icons";

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
 * Textfeld — gerundeter Kasten auf `--soft` (DESIGN.md, „Eingabefeld —
 * Formular"): passt zu Nachbarfeldern wie einer Textarea, die selbst keine
 * Pille sein kann. Die Pillenform ist der Suche vorbehalten (Home).
 */
export function Field({
  label,
  hint,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-muted">
        {label}
      </span>
      <input
        {...props}
        className={
          "block h-12 w-full rounded-soft border border-border bg-soft px-3.5 text-base " +
          "text-text outline-none transition-colors placeholder:text-muted " +
          "focus:border-text focus:bg-card focus:shadow-[0_0_0_3px_rgba(38,38,38,0.08)] " +
          className
        }
      />
      {hint && (
        <span className="mt-1.5 block text-[12.5px] text-muted">{hint}</span>
      )}
    </label>
  );
}

/**
 * Buttons — Pillen, vier Rollen: Primär (schwarze Fläche), Sekundär (Kontur),
 * Tertiär (Text + „→", kein Rahmen), Destruktiv (rote Fläche). Nur ein
 * Primärbutton pro Screen.
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
          "inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-text " +
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
    secondary: "border border-text text-text active:bg-text/5",
    danger: "bg-danger text-white",
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill px-6 " +
        "text-[15px] font-semibold press " +
        "disabled:cursor-not-allowed disabled:opacity-40 " +
        look +
        " " +
        className
      }
    >
      {loading ? (
        <LoadingDots aria-label="Lädt" />
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Ladeanzeige im Primärbutton — drei Punkte statt Spinner-Ring (DESIGN.md,
 * „Primärbutton": „Lädt: Label wird durch drei Punkte ersetzt"). Leichtes,
 * gestaffeltes Auf- und Abblenden statt Drehung; steht still bei
 * `prefers-reduced-motion`.
 */
function LoadingDots(props: { "aria-label"?: string }) {
  return (
    <span className="inline-flex items-center gap-1" {...props}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          aria-hidden
          className="dot-blink h-1.5 w-1.5 rounded-full bg-current"
          style={{ animationDelay: `${index * 160}ms` }}
        />
      ))}
    </span>
  );
}

/**
 * Meldung über einem Formular oder Screen.
 *
 * Getönte Fläche statt Rahmen — passt zur flachen Instagram-Baseline-Richtung,
 * in der Trennung sonst über Weißraum und Haarlinien läuft, nicht über
 * Konturen.
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
    error: "bg-danger-tint text-danger",
    ok: "bg-soft text-ok",
    info: "bg-soft text-muted",
  }[tone];

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={"rounded-soft px-4 py-3 text-[14px] leading-relaxed font-medium " + look}
    >
      {children}
    </p>
  );
}

/**
 * Kopfzeile eines Screens: Titel (Unbounded, 20 px) mit optionaler
 * tabellarischer Unterzeile und optionaler Aktion rechts (DESIGN.md-Muster
 * aus Liste/Aufgaben/Konto). Kein Riesentitel mehr — Hierarchie kommt in
 * dieser Richtung aus Feed/Foto, nicht aus einer Display-Versalie.
 */
export function ScreenHeader({
  title,
  lead,
  action,
}: {
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 pb-1.5">
      <div className="min-w-0">
        <h1
          lang="de"
          className="truncate font-display text-[20px] leading-[1.2] font-bold text-text"
        >
          {title}
        </h1>
        {lead && (
          <p className="tabular mt-0.5 text-[13px] text-muted">{lead}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
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
  tabbar = true,
  divider = true,
  children,
}: {
  title?: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  /**
   * Nimmt dem Rahmen Seitenrand und Abstand nach oben.
   *
   * Für Screens, auf denen ein Foto bis an den Bildschirmrand läuft und unter
   * der Statusleiste beginnt (Rezeptdetail). Die Abschnitte darunter setzen
   * ihren Seitenrand dann selbst.
   */
  bleed?: boolean;
  /**
   * `false` auf Screens ohne Tab-Leiste (Anmelden, Registrieren, Passwort,
   * Datenschutz, Haushalt starten) — sonst bliebe unten der Freiraum stehen,
   * den die schwebende Glas-Leiste sonst braucht.
   */
  tabbar?: boolean;
  /**
   * `false` blendet die Haarlinie unter dem Titel aus — auf Feed-Screens
   * (Einkaufsliste, Aufgaben), wo direkt darunter die „Etwas hinzufügen"-
   * Zeile folgt und die Linie nur eine zweite Trennung neben der eigenen
   * Kartenkontur wäre.
   */
  divider?: boolean;
  children: ReactNode;
}) {
  return (
    <main
      className={
        "flex-1 " + (tabbar ? "pb-tabbar " : "pb-safe ") + (bleed ? "pt-safe" : "px-5 pt-safe")
      }
    >
      <div className="mx-auto w-full max-w-md">
        {title !== undefined && (
          <>
            <ScreenHeader title={title} lead={lead} action={action} />
            {divider && <div className="h-px bg-border" />}
          </>
        )}
        <div className={bleed ? "" : "space-y-6 pt-5"}>{children}</div>
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
      <span className="mb-1.5 block text-[12.5px] font-medium text-muted">
        {label}
      </span>
      <select
        {...props}
        className={
          "block h-12 w-full appearance-none rounded-soft border border-border bg-soft " +
          "px-3.5 text-base text-text outline-none transition-colors " +
          "focus:border-text focus:bg-card focus:shadow-[0_0_0_3px_rgba(38,38,38,0.08)] " +
          className
        }
      >
        {children}
      </select>
      {hint && (
        <span className="mt-1.5 block text-[12.5px] text-muted">{hint}</span>
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
      <span className="mb-1.5 block text-[12.5px] font-medium text-muted">
        {label}
      </span>
      <textarea
        {...props}
        className={
          "block w-full rounded-soft border border-border bg-soft px-3.5 py-3 " +
          "text-base leading-relaxed text-text outline-none transition-colors placeholder:text-muted " +
          "focus:border-text focus:bg-card focus:shadow-[0_0_0_3px_rgba(38,38,38,0.08)] " +
          className
        }
      />
      {hint && (
        <span className="mt-1.5 block text-[12.5px] text-muted">{hint}</span>
      )}
    </label>
  );
}

/**
 * Zeile einer Liste, die auf einen Bildschirm führt (DESIGN.md-Muster
 * „settings-row" aus Konto): volle Breite, 52 px hoch, kein Rahmen, kein
 * Hintergrund — nur der Chevron rechts sagt, dass es weitergeht.
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
      className="flex min-h-[52px] items-center justify-between gap-3 py-2 text-[15px] text-text press-flat tap-target"
    >
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronRightIcon aria-hidden className="h-4 w-4 shrink-0 text-inactive" />
    </Link>
  );
}
