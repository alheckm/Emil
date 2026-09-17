/**
 * Erzwingt Architektur-Leitregel 1: src/lib/core bleibt portabel.
 *
 * Bewusst als *Allowlist* formuliert, nicht als Sperrliste: core darf nur sich
 * selbst und ausdrücklich freigegebene pure Pakete importieren. Eine Sperrliste
 * würde jedes neue Framework-Paket durchlassen, das noch keiner eingetragen hat.
 * Wer hier etwas ergänzen will, soll das bewusst tun — genau das ist der Zweck.
 */
module.exports = {
  forbidden: [
    {
      name: "core-nur-pure-abhaengigkeiten",
      comment:
        "src/lib/core muss ohne React, Next, DOM, Supabase und App-Code lauffähig " +
        "bleiben, damit eine spätere Expo-App den Parser, die Einheiten, die " +
        "Skalierung und die Merge-Logik unverändert übernehmen kann.",
      severity: "error",
      from: { path: "^src/lib/core", pathNot: "__tests__" },
      to: {
        pathNot: [
          "^src/lib/core",
          "node_modules/(decimal\\.js-light|zod)(/|$)",
        ],
      },
    },
    {
      name: "keine-zyklen",
      comment: "Zyklische Importe machen jede spätere Extraktion in ein Paket unmöglich.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "supabase-nur-in-der-datenschicht",
      comment:
        "Architektur-Leitregel: Supabase-Queries leben ausschließlich in src/lib/data " +
        "(plus Client-/Server-Setup). Ein nativer Client tauscht dann eine Schicht " +
        "statt die halbe App.",
      severity: "error",
      from: {
        path: "^src/(app|components)",
        pathNot: "^src/app/api",
      },
      to: { path: "node_modules/@supabase(/|$)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    exclude: { path: "\\.next|node_modules" },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
