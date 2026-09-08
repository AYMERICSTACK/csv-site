"use client";

import { useState } from "react";

type SourceResult = {
  key: string;
  status: number | null;
  ok: boolean;
  jsonValid: boolean;
  topLevelKeys?: string[];
  totalItems?: unknown;
  memberCount?: number | null;
  sample?: unknown;
  error?: string;
};

export default function FffResultsDiagnostic() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SourceResult[]>([]);

  async function run() {
    setRunning(true);
    setResults([]);
    const base = "https://api-dofa.fff.fr/api/compets/454799/phases/1/poules/2";
    const sources = [
      { key: "resultat", url: `${base}/resultat` },
      { key: "poule_journees", url: `${base}/poule_journees?details[]=pouleJourneeWithMatch` },
    ];
    const next: SourceResult[] = [];
    for (const source of sources) {
      try {
        const response = await fetch(source.url, {
          cache: "no-store",
          headers: { Accept: "application/ld+json, application/json" },
        });
        const body = await response.text();
        let data: unknown = null;
        try { data = JSON.parse(body); } catch { /* Réponse non JSON. */ }
        const record = data && typeof data === "object" && !Array.isArray(data)
          ? data as Record<string, unknown> : null;
        const members = Array.isArray(record?.["hydra:member"])
          ? record["hydra:member"] as unknown[] : null;
        next.push({
          key: source.key,
          status: response.status,
          ok: response.ok,
          jsonValid: record !== null,
          topLevelKeys: record ? Object.keys(record).slice(0, 25) : [],
          totalItems: record?.["hydra:totalItems"] ?? null,
          memberCount: members?.length ?? null,
          sample: response.ok && record
            ? (members ? members.slice(0, 1) : record)
            : undefined,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        });
      } catch (error) {
        next.push({
          key: source.key, status: null, ok: false, jsonValid: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      setResults([...next]);
    }
    setRunning(false);
  }

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-extrabold text-neutral-950">Diagnostic des résultats FFF</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Test Seniors 2 : lecture des résultats et journées depuis ton navigateur.
        Aucune donnée n’est enregistrée et aucun email n’est envoyé.
      </p>
      <button type="button" onClick={() => void run()} disabled={running}
        className="mt-4 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
        {running ? "Vérification en cours…" : "Tester les résultats Seniors 2"}
      </button>
      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((result) => (
            <div key={result.key} className="rounded-xl bg-neutral-50 p-3 text-sm">
              <strong>{result.key}</strong> — {result.status ?? "Réseau"} — {result.ok ? "OK" : "Échec"}
            </div>
          ))}
          <p className="text-xs text-neutral-500">Copie le JSON ci-dessous pour analyser la structure des journées.</p>
          <pre className="max-h-96 overflow-auto rounded-xl bg-neutral-950 p-4 text-xs text-white whitespace-pre-wrap break-all">{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
