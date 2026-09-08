"use client";

import { useEffect, useMemo, useState } from "react";

type TeamConfig = {
  team: string;
  sourceUrl: string | null;
};

type SyncState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

const DEFAULT_DOFA_URLS: Record<string, string> = {
  "Seniors 1":
    "https://api-dofa.fff.fr/api/compets/457862/phases/1/poules/8/classement_journees?page=1",
};

const STORAGE_KEY = "csv-fff-dofa-urls-v1";

function isDofaUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "api-dofa.fff.fr" &&
      url.pathname.includes("/classement_journees")
    );
  } catch {
    return false;
  }
}

export default function FffRankingSyncClient() {
  const [configs, setConfigs] = useState<TeamConfig[]>([]);
  const [dofaUrls, setDofaUrls] = useState<Record<string, string>>(
    DEFAULT_DOFA_URLS,
  );
  const [states, setStates] = useState<Record<string, SyncState>>({});
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        setDofaUrls((current) => ({ ...current, ...parsed }));
      }
    } catch {
      // Les URL par défaut restent utilisables.
    }

    void fetch("/api/admin/fff-ranking-sync", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Configuration indisponible.");
        setConfigs(Array.isArray(data?.teams) ? data.teams : []);
      })
      .catch((error) => {
        setStates({
          global: {
            status: "error",
            message: error instanceof Error ? error.message : "Erreur de configuration.",
          },
        });
      })
      .finally(() => setLoadingConfig(false));
  }, []);

  const configuredCount = useMemo(
    () =>
      configs.filter(
        (config) => config.sourceUrl && isDofaUrl(dofaUrls[config.team] || ""),
      ).length,
    [configs, dofaUrls],
  );

  function updateDofaUrl(team: string, value: string) {
    const next = { ...dofaUrls, [team]: value };
    setDofaUrls(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setStates((current) => ({ ...current, [team]: { status: "idle" } }));
  }

  async function syncTeam(config: TeamConfig) {
    const dofaUrl = (dofaUrls[config.team] || "").trim();

    if (!config.sourceUrl) {
      setStates((current) => ({
        ...current,
        [config.team]: {
          status: "error",
          message: "Aucun lien FFF n’est configuré pour cette équipe.",
        },
      }));
      return false;
    }

    if (!isDofaUrl(dofaUrl)) {
      setStates((current) => ({
        ...current,
        [config.team]: {
          status: "error",
          message: "Colle l’URL API DOFA classement_journees de cette équipe.",
        },
      }));
      return false;
    }

    setStates((current) => ({
      ...current,
      [config.team]: { status: "loading", message: "Lecture FFF en cours…" },
    }));

    try {
      // Cette requête part du navigateur de l'admin (IP résidentielle), pas de Vercel.
      const dofaResponse = await fetch(dofaUrl, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/ld+json, application/json" },
      });

      if (!dofaResponse.ok) {
        throw new Error(`FFF DOFA HTTP ${dofaResponse.status}`);
      }

      const dofaPayload = await dofaResponse.json();

      const saveResponse = await fetch("/api/admin/fff-ranking-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team: config.team,
          sourceUrl: config.sourceUrl,
          dofaPayload,
        }),
      });

      const result = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(result?.error || "Impossible d’enregistrer le classement.");
      }

      setStates((current) => ({
        ...current,
        [config.team]: {
          status: "success",
          message: `Mis à jour : ${result.rank}e · ${result.points ?? "—"} pt(s)`,
        },
      }));
      return true;
    } catch (error) {
      const message =
        error instanceof TypeError && /fetch/i.test(error.message)
          ? "Le navigateur n’a pas pu lire l’API FFF (probable blocage CORS)."
          : error instanceof Error
            ? error.message
            : "Erreur inconnue.";

      setStates((current) => ({
        ...current,
        [config.team]: { status: "error", message },
      }));
      return false;
    }
  }

  async function syncAll() {
    for (const config of configs) {
      if (config.sourceUrl && isDofaUrl(dofaUrls[config.team] || "")) {
        await syncTeam(config);
      }
    }
  }

  if (loadingConfig) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm font-semibold text-neutral-600">
        Chargement de la configuration…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-orange-200 bg-orange-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">
              Synchronisation navigateur
            </div>
            <h2 className="mt-2 text-2xl font-black text-neutral-950">
              Mettre à jour les classements
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-600">
              La lecture FFF est faite directement depuis ton navigateur, puis le classement valide est enregistré dans Neon. Vercel ne contacte donc pas la FFF.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void syncAll()}
            disabled={configuredCount === 0}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Synchroniser les équipes configurées
          </button>
        </div>
      </section>

      {states.global?.status === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {states.global.message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {configs.map((config) => {
          const state = states[config.team] || { status: "idle" as const };
          const dofaUrl = dofaUrls[config.team] || "";

          return (
            <article
              key={config.team}
              className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    Championnat
                  </div>
                  <h3 className="mt-1 text-xl font-black text-neutral-950">
                    {config.team}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    state.status === "success"
                      ? "bg-green-100 text-green-700"
                      : state.status === "error"
                        ? "bg-red-100 text-red-700"
                        : state.status === "loading"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {state.status === "success"
                    ? "À jour"
                    : state.status === "error"
                      ? "Erreur"
                      : state.status === "loading"
                        ? "En cours"
                        : "Prêt"}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-neutral-500">
                    URL API DOFA
                  </label>
                  <input
                    type="url"
                    value={dofaUrl}
                    onChange={(event) => updateDofaUrl(config.team, event.target.value)}
                    placeholder="https://api-dofa.fff.fr/api/compets/.../classement_journees?page=1"
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-orange-400 focus:bg-white"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                    Cette URL est mémorisée uniquement dans ce navigateur.
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
                  <span className="font-black text-neutral-800">Lien FFF public :</span>{" "}
                  {config.sourceUrl ? "configuré" : "manquant"}
                </div>

                <button
                  type="button"
                  onClick={() => void syncTeam(config)}
                  disabled={state.status === "loading"}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {state.status === "loading"
                    ? "Synchronisation…"
                    : `Synchroniser ${config.team}`}
                </button>

                {state.message && (
                  <p
                    className={`text-sm font-bold ${
                      state.status === "success"
                        ? "text-green-700"
                        : state.status === "error"
                          ? "text-red-700"
                          : "text-neutral-600"
                    }`}
                  >
                    {state.message}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm leading-relaxed text-neutral-600">
        <strong className="text-neutral-900">Pour Seniors 2, 3 et 4 :</strong>{" "}
        ouvre leur classement LAuRAFoot, puis dans F12 → Réseau → Fetch/XHR, copie la requête
        <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs font-bold text-neutral-800">
          classement_journees?page=1
        </code>
        et colle-la ici une seule fois.
      </section>
    </div>
  );
}
