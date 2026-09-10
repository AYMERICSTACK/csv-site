"use client";

import Link from "next/link";
import { parseMatchdays } from "@/lib/fff-matchday";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, Trophy } from "lucide-react";

type TeamConfig = { team: string; dofaUrl: string };
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
type DofaMatchday = { number?: number; name?: string; date?: string; matchs?: DofaMatch[] };
type SavedDay = {
  dayNumber: number;
  dayDate: string;
  totalMatches: number;
  resultCount: number;
  complete: boolean;
  checkedAt: string;
  rankingSyncedAt: string | null;
  notificationSentAt: string | null;
};
type MatchdayState =
  | { status: "loading" }
  | { status: "idle"; message: string }
  | { status: "error"; message: string }
  | {
      status: "ready";
      number: number | null;
      date: string | null;
      totalMatches: number;
      resultCount: number;
      complete: boolean;
      checkedAt: string | null;
      rankingSyncedAt: string | null;
      notificationSentAt: string | null;
    };

function buildMatchdaysUrl(dofaRankingUrl: string) {
  const url = new URL(dofaRankingUrl);
  if (url.hostname !== "api-dofa.fff.fr") throw new Error("Source FFF invalide.");
  url.pathname = url.pathname.replace(/\/classement_journees$/, "/poule_journees");
  url.search = "";
  url.searchParams.append("details[]", "pouleJourneeWithMatch");
  return url.toString();
}

function formatDay(date: string | null) {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
  }).format(value);
}

function formatCheckedAt(date: string | null) {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  }).format(value);
}

function parisDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Paris",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

// Une vérification FFF automatique maximum par week-end sportif (vendredi -> lundi).
// Du mardi au jeudi, aucune requête FFF n'est lancée automatiquement.
function currentFootballWeekendStart() {
  const todayKey = parisDateKey(new Date());
  const [year, month, day] = todayKey.split("-").map(Number);
  const surrogate = new Date(Date.UTC(year, month - 1, day));
  const weekday = surrogate.getUTCDay();
  const offsets: Record<number, number> = { 5: 0, 6: 1, 0: 2, 1: 3 };
  const offset = offsets[weekday];
  if (offset === undefined) return null;
  surrogate.setUTCDate(surrogate.getUTCDate() - offset);
  return surrogate.toISOString().slice(0, 10);
}

function stateFromSaved(day: SavedDay): MatchdayState {
  return {
    status: "ready",
    number: day.dayNumber,
    date: day.dayDate,
    totalMatches: day.totalMatches,
    resultCount: day.resultCount,
    complete: day.complete,
    checkedAt: day.checkedAt,
    rankingSyncedAt: day.rankingSyncedAt,
    notificationSentAt: day.notificationSentAt,
  };
}

export default function FffMatchdayStatusClient({ team }: { team: string }) {
  const [state, setState] = useState<MatchdayState>({ status: "loading" });

  const fetchSavedState = useCallback(async () => {
    const response = await fetch(`/api/admin/fff-matchday-status?team=${encodeURIComponent(team)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || "État FFF indisponible.");
    const days = Array.isArray(payload?.days) ? (payload.days as SavedDay[]) : [];
    const latest = [...days].sort(
      (a, b) => new Date(b.dayDate).getTime() - new Date(a.dayDate).getTime() || b.dayNumber - a.dayNumber,
    )[0];
    return latest ?? null;
  }, [team]);

  const checkFff = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const configResponse = await fetch("/api/admin/fff-ranking-sync", { cache: "no-store" });
      const configPayload = await configResponse.json();
      if (!configResponse.ok) throw new Error(configPayload?.error || "Configuration FFF indisponible.");

      const configs = Array.isArray(configPayload?.teams) ? (configPayload.teams as TeamConfig[]) : [];
      const config = configs.find((item) => item.team === team);
      if (!config?.dofaUrl) throw new Error(`Configuration ${team} introuvable.`);

      const matchdaysUrl = buildMatchdaysUrl(config.dofaUrl);
      const response = await fetch(matchdaysUrl, {
        cache: "no-store",
        headers: { Accept: "application/ld+json, application/json" },
      });
      if (!response.ok) throw new Error(`FFF DOFA HTTP ${response.status}`);

      const payload = await response.json();
      const parsedSource = new URL(matchdaysUrl).origin + new URL(matchdaysUrl).pathname;
      const matchdays = parseMatchdays(payload, parsedSource);

      const savedResponse = await fetch("/api/admin/fff-matchday-status", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, dofaPayload: payload }),
      });
      const savedPayload = await savedResponse.json();
      if (!savedResponse.ok) throw new Error(savedPayload?.error || "Enregistrement impossible.");
      const savedDays = Array.isArray(savedPayload.days) ? (savedPayload.days as SavedDay[]) : [];

      const latest = matchdays
        .filter((day) => day.date.getTime() <= Date.now() && day.totalMatches > 0)
        .sort((a, b) => b.date.getTime() - a.date.getTime() || b.number - a.number)[0];
      if (!latest) throw new Error(`Aucune journée passée trouvée pour ${team}.`);
      const saved = savedDays.find((day) => day.dayNumber === latest.number);

      setState({
        status: "ready",
        number: latest.number,
        date: latest.date.toISOString(),
        totalMatches: latest.totalMatches,
        resultCount: latest.resultCount,
        complete: latest.complete,
        checkedAt: saved?.checkedAt ?? new Date().toISOString(),
        rankingSyncedAt: saved?.rankingSyncedAt ?? null,
        notificationSentAt: saved?.notificationSentAt ?? null,
      });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Erreur inconnue." });
    }
  }, [team]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const saved = await fetchSavedState();
        if (cancelled) return;

        if (saved) setState(stateFromSaved(saved));
        else setState({ status: "idle", message: "Aucune vérification enregistrée pour cette équipe." });

        const weekendStart = currentFootballWeekendStart();
        if (!weekendStart) return;

        const alreadyCheckedThisWeekend = saved?.checkedAt
          ? parisDateKey(new Date(saved.checkedAt)) >= weekendStart
          : false;
        if (!alreadyCheckedThisWeekend && !cancelled) await checkFff();
      } catch (error) {
        if (!cancelled) {
          setState({ status: "error", message: error instanceof Error ? error.message : "Erreur inconnue." });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [checkFff, fetchSavedState]);

  return (
    <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600">
              <Trophy size={16} /> Résultats officiels FFF
            </div>
            <h2 className="mt-2 text-xl font-black text-neutral-950">État de la dernière journée</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Une vérification FFF est lancée automatiquement au maximum une fois par week-end. Ensuite, l’actualisation reste manuelle.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void checkFff()}
            disabled={state.status === "loading"}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={state.status === "loading" ? "animate-spin" : ""} /> Actualiser
          </button>
        </div>

        {state.status === "loading" && (
          <div className="mt-5 rounded-2xl bg-neutral-50 p-5 text-sm font-bold text-neutral-500">Lecture des résultats FFF en cours…</div>
        )}

        {state.status === "idle" && (
          <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm font-bold text-neutral-600">
            {state.message} Clique sur « Actualiser » pour lancer le premier contrôle.
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            Impossible de vérifier les résultats : {state.message}
          </div>
        )}

        {state.status === "ready" && (
          <div className={`mt-5 rounded-2xl border p-5 ${state.complete ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
            <div className="flex items-start gap-3">
              {state.complete ? <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={22} /> : <Clock3 className="mt-0.5 shrink-0 text-orange-600" size={22} />}
              <div className="min-w-0">
                <div className={`text-lg font-black ${state.complete ? "text-green-900" : "text-orange-900"}`}>
                  {state.complete
                    ? `Journée ${state.number ?? "—"} complète — ${state.rankingSyncedAt ? "classement à jour" : "classement à mettre à jour"}`
                    : `Journée ${state.number ?? "—"} en attente`}
                </div>
                <p className={`mt-1 text-sm font-bold ${state.complete ? "text-green-700" : "text-orange-700"}`}>
                  {state.resultCount} résultat{state.resultCount > 1 ? "s" : ""} sur {state.totalMatches} publié{state.totalMatches > 1 ? "s" : ""} par la FFF
                  {formatDay(state.date) ? ` · ${formatDay(state.date)}` : ""}.
                </p>
                {formatCheckedAt(state.checkedAt) && (
                  <p className="mt-2 text-xs font-semibold text-neutral-500">Dernière vérification FFF : {formatCheckedAt(state.checkedAt)}.</p>
                )}
                {state.rankingSyncedAt && <p className="mt-2 text-sm font-bold text-green-800">Classement synchronisé le {formatDay(state.rankingSyncedAt)}.</p>}
                {!state.rankingSyncedAt && state.notificationSentAt && <p className="mt-2 text-sm font-bold text-green-800">Rappel envoyé au(x) responsable(s) de l’équipe.</p>}
                {!state.complete && <p className="mt-2 text-sm text-neutral-600">Le classement sera prêt lorsque tous les matchs de cette journée auront un score.</p>}
              </div>
            </div>
            {state.complete && (
              <Link href="/espace-educateurs/classements-fff" className="mt-4 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-black text-white transition hover:bg-neutral-800">
                Mettre à jour mon classement →
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
