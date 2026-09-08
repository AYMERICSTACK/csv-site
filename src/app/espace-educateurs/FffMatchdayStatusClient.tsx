"use client";

import Link from "next/link";
import { parseMatchdays } from "@/lib/fff-matchday";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, Trophy } from "lucide-react";

type TeamConfig = {
  team: string;
  dofaUrl: string;
};

type DofaMatch = {
  ma_no?: number;
  home?: { short_name?: string };
  away?: { short_name?: string };
  home_score?: number | null;
  away_score?: number | null;
  status?: string;
  date?: string;
  time?: string;
};

type DofaMatchday = {
  number?: number;
  name?: string;
  date?: string;
  matchs?: DofaMatch[];
};

type MatchdayState =
  | { status: "loading" }
  | { status: "unsupported" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      number: number | null;
      date: string | null;
      totalMatches: number;
      resultCount: number;
      complete: boolean;
      rankingSyncedAt: string | null;
    };

function buildMatchdaysUrl(dofaRankingUrl: string) {
  const url = new URL(dofaRankingUrl);
  if (url.hostname !== "api-dofa.fff.fr") {
    throw new Error("Source FFF invalide.");
  }

  url.pathname = url.pathname.replace(
    /\/classement_journees$/,
    "/poule_journees",
  );
  url.search = "";
  url.searchParams.append("details[]", "pouleJourneeWithMatch");
  return url.toString();
}

function hasResult(match: DofaMatch) {
  return (
    typeof match.home_score === "number" &&
    Number.isFinite(match.home_score) &&
    typeof match.away_score === "number" &&
    Number.isFinite(match.away_score)
  );
}

function formatDay(date: string | null) {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(value);
}

export default function FffMatchdayStatusClient({ team }: { team: string }) {
  const [state, setState] = useState<MatchdayState>({ status: "loading" });

  const check = useCallback(async () => {
    if (team !== "Seniors 2") {
      setState({ status: "unsupported" });
      return;
    }

    setState({ status: "loading" });

    try {
      const configResponse = await fetch("/api/admin/fff-ranking-sync", {
        cache: "no-store",
      });
      const configPayload = await configResponse.json();

      if (!configResponse.ok) {
        throw new Error(configPayload?.error || "Configuration FFF indisponible.");
      }

      const configs = Array.isArray(configPayload?.teams)
        ? (configPayload.teams as TeamConfig[])
        : [];
      const config = configs.find((item) => item.team === "Seniors 2");

      if (!config?.dofaUrl) {
        throw new Error("Configuration Seniors 2 introuvable.");
      }

      const matchdaysUrl = buildMatchdaysUrl(config.dofaUrl);
      const response = await fetch(matchdaysUrl, {
        cache: "no-store",
        headers: { Accept: "application/ld+json, application/json" },
      });

      if (!response.ok) {
        throw new Error(`FFF DOFA HTTP ${response.status}`);
      }

      const payload = await response.json();
      const matchdays = parseMatchdays(payload);
      const savedResponse = await fetch("/api/admin/fff-matchday-status", {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, dofaPayload: payload }),
      });
      const savedPayload = await savedResponse.json();
      if (!savedResponse.ok) throw new Error(savedPayload?.error || "Enregistrement impossible.");
      const savedDays = Array.isArray(savedPayload.days) ? savedPayload.days : [];

      const latest = matchdays
        .filter(day => day.date.getTime() <= Date.now() && day.totalMatches > 0)
        .sort((a,b) => b.date.getTime()-a.date.getTime() || b.number-a.number)[0];
      if (!latest) throw new Error("Aucune journée passée trouvée pour Seniors 2.");
      const saved = savedDays.find((day: { dayNumber: number }) => day.dayNumber === latest.number);
      setState({
        status: "ready", number: latest.number, date: latest.date.toISOString(),
        totalMatches: latest.totalMatches, resultCount: latest.resultCount,
        complete: latest.complete,
        rankingSyncedAt: saved?.rankingSyncedAt ?? null,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Erreur inconnue.",
      });
    }
  }, [team]);

  useEffect(() => {
    void check();
  }, [check]);

  if (state.status === "unsupported") return null;

  return (
    <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600">
              <Trophy size={16} /> Résultats officiels FFF
            </div>
            <h2 className="mt-2 text-xl font-black text-neutral-950">
              État de la dernière journée
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Vérification automatique depuis ton navigateur. L’état des journées est enregistré dans Neon. Aucun résultat de match n’est modifié.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void check()}
            disabled={state.status === "loading"}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={state.status === "loading" ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {state.status === "loading" && (
          <div className="mt-5 rounded-2xl bg-neutral-50 p-5 text-sm font-bold text-neutral-500">
            Lecture des résultats FFF en cours…
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            Impossible de vérifier les résultats : {state.message}
          </div>
        )}

        {state.status === "ready" && (
          <div className={`mt-5 rounded-2xl border p-5 ${
            state.complete
              ? "border-green-200 bg-green-50"
              : "border-orange-200 bg-orange-50"
          }`}>
            <div className="flex items-start gap-3">
              {state.complete ? (
                <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={22} />
              ) : (
                <Clock3 className="mt-0.5 shrink-0 text-orange-600" size={22} />
              )}
              <div className="min-w-0">
                <div className={`text-lg font-black ${state.complete ? "text-green-900" : "text-orange-900"}`}>
                  Journée {state.number ?? "—"} {state.complete ? "complète" : "en attente"}
                </div>
                <p className={`mt-1 text-sm font-bold ${state.complete ? "text-green-700" : "text-orange-700"}`}>
                  {state.resultCount} résultat{state.resultCount > 1 ? "s" : ""} sur {state.totalMatches} publié{state.totalMatches > 1 ? "s" : ""} par la FFF
                  {formatDay(state.date) ? ` · ${formatDay(state.date)}` : ""}.
                </p>
                {state.rankingSyncedAt && (
                  <p className="mt-2 text-sm font-bold text-green-800">
                    Classement synchronisé le {formatDay(state.rankingSyncedAt)}.
                  </p>
                )}
                {!state.complete && (
                  <p className="mt-2 text-sm text-neutral-600">
                    Le classement ne sera considéré comme prêt que lorsque tous les matchs auront un score. Les cas reportés seront traités dans l’étape suivante.
                  </p>
                )}
              </div>
            </div>

            {state.complete && (
              <Link
                href="/espace-educateurs/classements-fff"
                className="mt-4 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:bg-neutral-800"
              >
                Mettre à jour mon classement →
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
