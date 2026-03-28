"use client";

import { useMemo, useState } from "react";

type MatchItem = {
  id: string;
  category: string;
  team: string;
  opponent: string;
  matchDate: string;
  location: string;
  isHome: boolean;
  status: string;
  scoreTeam: number | null;
  scoreOpponent: number | null;
  scorers: string | null;
  createdAt: string;
  updatedAt: string;
};

type FilterKey = "all" | "ecole" | "jeunes" | "seniors";

type Props = {
  recentResults: MatchItem[];
  upcomingMatches: MatchItem[];
};

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Toutes" },
  { key: "ecole", label: "École de foot" },
  { key: "jeunes", label: "Jeunes compétition" },
  { key: "seniors", label: "Seniors" },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getCategoryGroup(category: string): FilterKey {
  const value = normalize(category);

  if (
    value.includes("senior") ||
    value.includes("veteran") ||
    value.includes("vétéran")
  ) {
    return "seniors";
  }

  if (
    value.includes("u6") ||
    value.includes("u7") ||
    value.includes("u8") ||
    value.includes("u9") ||
    value.includes("u10") ||
    value.includes("u11") ||
    value.includes("ecole de foot") ||
    value.includes("école de foot") ||
    value.includes("plateau") ||
    value.includes("foot animation")
  ) {
    return "ecole";
  }

  if (
    value.includes("u12") ||
    value.includes("u13") ||
    value.includes("u14") ||
    value.includes("u15") ||
    value.includes("u16") ||
    value.includes("u17") ||
    value.includes("u18") ||
    value.includes("jeune")
  ) {
    return "jeunes";
  }

  return "all";
}

function matchPassesFilter(match: MatchItem, filter: FilterKey) {
  if (filter === "all") return true;
  return getCategoryGroup(match.category) === filter;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  switch (status) {
    case "scheduled":
      return "Programmé";
    case "postponed":
      return "Reporté";
    case "cancelled":
      return "Annulé";
    case "finished":
      return "Terminé";
    default:
      return status;
  }
}

function getResultLabel(scoreTeam: number, scoreOpponent: number) {
  if (scoreTeam > scoreOpponent) return "Victoire";
  if (scoreTeam < scoreOpponent) return "Défaite";
  return "Nul";
}

function getResultBadgeClasses(scoreTeam: number, scoreOpponent: number) {
  if (scoreTeam > scoreOpponent) {
    return "border border-green-200 bg-green-100 text-green-800";
  }

  if (scoreTeam < scoreOpponent) {
    return "border border-red-200 bg-red-100 text-red-800";
  }

  return "border border-amber-200 bg-amber-100 text-amber-800";
}

function getUpcomingStatusClasses(status: string) {
  switch (status) {
    case "scheduled":
      return "border border-blue-200 bg-blue-100 text-blue-800";
    case "postponed":
      return "border border-amber-200 bg-amber-100 text-amber-800";
    case "cancelled":
      return "border border-red-200 bg-red-100 text-red-800";
    default:
      return "border border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function ResultCard({ match }: { match: MatchItem }) {
  if (match.scoreTeam === null || match.scoreOpponent === null) {
    return null;
  }

  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {match.category}
          </div>
          <h3 className="mt-2 text-lg font-extrabold text-neutral-900">
            {match.team} vs {match.opponent}
          </h3>
        </div>

        <div
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getResultBadgeClasses(
            match.scoreTeam,
            match.scoreOpponent,
          )}`}
        >
          {getResultLabel(match.scoreTeam, match.scoreOpponent)}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold text-neutral-500">CSV</div>
          <div className="text-base font-extrabold text-neutral-900">
            {match.team}
          </div>
        </div>

        <div className="rounded-2xl bg-csv-orange/10 px-4 py-3 text-center">
          <div className="text-2xl font-extrabold tracking-tight text-csv-black">
            {match.scoreTeam} - {match.scoreOpponent}
          </div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
            Score final
          </div>
        </div>

        <div className="text-left">
          <div className="text-sm font-semibold text-neutral-500">
            Adversaire
          </div>
          <div className="text-base font-extrabold text-neutral-900">
            {match.opponent}
          </div>
        </div>
      </div>

      {match.scorers ? (
        <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <span className="font-semibold text-neutral-900">Buteurs :</span>{" "}
          {match.scorers}
        </div>
      ) : null}

      <div className="mt-4 space-y-2 text-sm text-neutral-600">
        <div>{formatDate(match.matchDate)}</div>
        <div>
          <span className="font-semibold text-neutral-900">Lieu :</span>{" "}
          {match.location}
        </div>
        <div>
          <span className="font-semibold text-neutral-900">Type :</span>{" "}
          {match.isHome ? "Domicile" : "Extérieur"}
        </div>
      </div>
    </article>
  );
}

function UpcomingCard({ match }: { match: MatchItem }) {
  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {match.category}
          </div>
          <h3 className="mt-2 text-lg font-extrabold text-neutral-900">
            {match.team} vs {match.opponent}
          </h3>
        </div>

        <div
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getUpcomingStatusClasses(
            match.status,
          )}`}
        >
          {formatStatus(match.status)}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="grid gap-2 text-sm text-neutral-700">
          <div>
            <span className="font-semibold text-neutral-900">Date :</span>{" "}
            {formatDate(match.matchDate)}
          </div>
          <div>
            <span className="font-semibold text-neutral-900">Lieu :</span>{" "}
            {match.location}
          </div>
          <div>
            <span className="font-semibold text-neutral-900">Type :</span>{" "}
            {match.isHome ? "Domicile" : "Extérieur"}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CalendarMatchesClient({
  recentResults,
  upcomingMatches,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredRecentResults = useMemo(() => {
    return recentResults.filter((match) =>
      matchPassesFilter(match, activeFilter),
    );
  }, [recentResults, activeFilter]);

  const filteredUpcomingMatches = useMemo(() => {
    return upcomingMatches.filter((match) =>
      matchPassesFilter(match, activeFilter),
    );
  }, [upcomingMatches, activeFilter]);

  const hasContent =
    filteredRecentResults.length > 0 || filteredUpcomingMatches.length > 0;

  return (
    <div className="mt-10 space-y-10">
      <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-csv-black text-white"
                    : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {!hasContent ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
          Aucun match à afficher pour ce filtre.
        </div>
      ) : null}

      {filteredRecentResults.length > 0 ? (
        <section className="space-y-5">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">
              Résultats récents
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700 md:text-base">
              Les matchs terminés des 7 derniers jours.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredRecentResults.map((match: any) (
              <ResultCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ) : null}

      {filteredUpcomingMatches.length > 0 ? (
        <section className="space-y-5">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">
              Prochains matchs du week-end
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700 md:text-base">
              Les rencontres à venir du vendredi soir au dimanche.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredUpcomingMatches.map((match: any) (
              <UpcomingCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
