"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type TeamConfig = {
  team: string;
  sourceUrl: string;
  dofaUrl: string;
};

type SyncState = {
  status: "idle" | "loading" | "success" | "unavailable" | "error";
  message?: string;
};

const DOFA_MAX_ATTEMPTS = 3;
const DOFA_RETRY_DELAY_MS = 900;
const SYNC_ALL_DELAY_MS = 450;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getFetchErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "La FFF n’a pas répondu dans le délai prévu.";
  }

  if (error instanceof TypeError) {
    return `Connexion à l’API FFF impossible (${error.message || "erreur réseau / CORS"}).`;
  }

  return error instanceof Error ? error.message : "Erreur inconnue.";
}

async function fetchDofaWithRetry(
  url: string,
  onAttempt: (attempt: number) => void,
) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= DOFA_MAX_ATTEMPTS; attempt += 1) {
    onAttempt(attempt);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/ld+json, application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = new Error(`FFF DOFA HTTP ${response.status}`);
        // Une erreur client permanente ne gagnera rien à être rejouée.
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
          throw Object.assign(error, { retryable: false });
        }
        throw error;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if ((error as { retryable?: boolean })?.retryable === false) break;
      if (attempt < DOFA_MAX_ATTEMPTS) await wait(DOFA_RETRY_DELAY_MS * attempt);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("Impossible de lire l’API FFF.");
}

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
  const searchParams = useSearchParams();
  const requestedTeam = searchParams.get("team")?.trim() || null;
  const highlightedRef = useRef<HTMLElement | null>(null);
  const [configs, setConfigs] = useState<TeamConfig[]>([]);
  const [states, setStates] = useState<Record<string, SyncState>>({});
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/fff-ranking-sync", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Configuration indisponible.");
        }
        setConfigs(Array.isArray(data?.teams) ? data.teams : []);
      })
      .catch((error) => {
        setStates({
          global: {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Erreur de configuration.",
          },
        });
      })
      .finally(() => setLoadingConfig(false));
  }, []);

  const configuredCount = useMemo(
    () => configs.filter((config) => isDofaUrl(config.dofaUrl)).length,
    [configs],
  );

  const highlightedTeam = useMemo(
    () => configs.find((config) => config.team === requestedTeam)?.team ?? null,
    [configs, requestedTeam],
  );

  useEffect(() => {
    if (!loadingConfig && highlightedTeam) {
      window.setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [loadingConfig, highlightedTeam]);

  async function syncTeam(config: TeamConfig) {
    if (!isDofaUrl(config.dofaUrl)) {
      setStates((current) => ({
        ...current,
        [config.team]: {
          status: "error",
          message: "La source DOFA de cette équipe est invalide.",
        },
      }));
      return false;
    }

    setStates((current) => ({
      ...current,
      [config.team]: {
        status: "loading",
        message: "Lecture FFF en cours…",
      },
    }));

    try {
      // Important : cette requête part du navigateur de l'admin.
      // Vercel ne contacte pas directement api-dofa.fff.fr.
      const dofaPayload = await fetchDofaWithRetry(config.dofaUrl, (attempt) => {
        setStates((current) => ({
          ...current,
          [config.team]: {
            status: "loading",
            message:
              attempt === 1
                ? "Lecture FFF en cours…"
                : `Nouvelle tentative FFF ${attempt}/${DOFA_MAX_ATTEMPTS}…`,
          },
        }));
      });

      const saveResponse = await fetch("/api/admin/fff-ranking-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team: config.team,
          dofaPayload,
        }),
      });

      const result = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(
          result?.error || "Impossible d’enregistrer le classement.",
        );
      }

      setStates((current) => ({
        ...current,
        [config.team]: {
          status: result.available === false ? "unavailable" : "success",
          message: result.available === false
            ? "Classement pas encore disponible."
            : `Mis à jour : ${result.rank}e · ${result.points ?? "—"} pt(s)`,
        },
      }));

      return true;
    } catch (error) {
      const message = getFetchErrorMessage(error);

      setStates((current) => ({
        ...current,
        [config.team]: { status: "error", message },
      }));

      return false;
    }
  }

  async function syncAll() {
    setSyncingAll(true);

    try {
      const eligibleConfigs = configs.filter((config) => isDofaUrl(config.dofaUrl));

      for (let index = 0; index < eligibleConfigs.length; index += 1) {
        await syncTeam(eligibleConfigs[index]);
        if (index < eligibleConfigs.length - 1) {
          await wait(SYNC_ALL_DELAY_MS);
        }
      }
    } finally {
      setSyncingAll(false);
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
              {configuredCount === 1
                ? "Mettre à jour mon classement"
                : "Mettre à jour les classements"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-600">
              Les sources officielles sont déjà configurées. Ton navigateur lit
              les classements FFF/DOFA puis envoie uniquement les données
              validées à Neon. Vercel ne contacte pas directement la FFF.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void syncAll()}
            disabled={configuredCount === 0 || syncingAll}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {syncingAll
              ? "Synchronisation en cours…"
              : configuredCount === 1
                ? "Synchroniser mon classement"
                : `Synchroniser les ${configuredCount} équipes`}
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

          return (
            <article
              key={config.team}
              ref={config.team === highlightedTeam ? highlightedRef : undefined}
              className={`rounded-[1.75rem] border bg-white p-5 shadow-sm transition sm:p-6 ${
                config.team === highlightedTeam
                  ? "border-orange-400 ring-4 ring-orange-100"
                  : "border-neutral-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    Championnat
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-neutral-950">{config.team}</h3>
                    {config.team === highlightedTeam && (
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-orange-700">
                        Équipe à mettre à jour
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    state.status === "success"
                      ? "bg-green-100 text-green-700"
                      : state.status === "unavailable"
                        ? "bg-neutral-100 text-neutral-600"
                      : state.status === "error"
                        ? "bg-red-100 text-red-700"
                        : state.status === "loading"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {state.status === "success"
                    ? "À jour"
                    : state.status === "unavailable"
                      ? "Pas encore disponible"
                    : state.status === "error"
                      ? "Erreur"
                      : state.status === "loading"
                        ? "En cours"
                        : "Prêt"}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600">
                  <div>
                    <span className="font-black text-neutral-800">
                      Source officielle :
                    </span>{" "}
                    configurée
                  </div>
                  <div className="mt-1">
                    <span className="font-black text-neutral-800">
                      API DOFA :
                    </span>{" "}
                    configurée
                  </div>
                </div>

                <a
                  href={config.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-bold text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition hover:text-orange-600"
                >
                  Ouvrir le classement officiel ↗
                </a>

                <button
                  type="button"
                  onClick={() => void syncTeam(config)}
                  disabled={state.status === "loading" || syncingAll}
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
        <strong className="text-neutral-900">À noter :</strong>{" "}
        Les équipes sans classement officiel ne sont pas synchronisées.
      </section>
    </div>
  );
}
