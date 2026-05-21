"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, Trophy } from "lucide-react";

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
type ViewFilterKey = "all" | "upcoming" | "results";

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

const VIEW_FILTERS: Array<{ key: ViewFilterKey; label: string }> = [
  { key: "all", label: "Tout voir" },
  { key: "upcoming", label: "À venir" },
  { key: "results", label: "Résultats" },
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
    value.includes("u19") ||
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

function getCategoryOrder(category: string) {
  const value = normalize(category);

  if (value.includes("senior")) return 100;
  if (value.includes("femin")) return 90;
  if (value.includes("veteran")) return 80;
  if (value.includes("u19")) return 70;
  if (value.includes("u18")) return 69;
  if (value.includes("u17")) return 68;
  if (value.includes("u16")) return 67;
  if (value.includes("u15")) return 66;
  if (value.includes("u14")) return 65;
  if (value.includes("u13")) return 64;
  if (value.includes("u12")) return 63;
  if (value.includes("u11")) return 62;
  if (value.includes("u10")) return 61;
  if (value.includes("u9")) return 60;
  if (value.includes("u8")) return 59;
  if (value.includes("u7")) return 58;
  if (value.includes("u6")) return 57;

  return 10;
}

function groupMatchesByCategory(matches: MatchItem[]) {
  const groups = new Map<string, MatchItem[]>();

  for (const match of matches) {
    const current = groups.get(match.category) ?? [];
    current.push(match);
    groups.set(match.category, current);
  }

  return Array.from(groups.entries())
    .sort((a, b) => {
      const orderA = getCategoryOrder(a[0]);
      const orderB = getCategoryOrder(b[0]);

      if (orderA !== orderB) {
        return orderB - orderA;
      }

      return a[0].localeCompare(b[0], "fr");
    })
    .map(([category, items]) => ({
      category,
      items,
    }));
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString("fr-FR", {
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
    return "border border-green-300 bg-green-100 text-green-800";
  }

  if (scoreTeam < scoreOpponent) {
    return "border border-red-300 bg-red-100 text-red-800";
  }

  return "border border-orange-300 bg-orange-100 text-orange-800";
}

function getUpcomingStatusClasses(status: string) {
  switch (status) {
    case "scheduled":
      return "border border-blue-300 bg-blue-100 text-blue-800";
    case "postponed":
      return "border border-orange-300 bg-orange-100 text-orange-800";
    case "cancelled":
      return "border border-red-300 bg-red-100 text-red-800";
    default:
      return "border border-neutral-300 bg-neutral-100 text-neutral-700";
  }
}

function getVenueBadge(match: MatchItem) {
  if (match.isHome) {
    return {
      label: "🏠 Domicile",
      className:
        "border border-orange-500 bg-orange-500 text-white shadow-[0_10px_25px_-10px_rgba(255,122,0,0.9)]",
    };
  }

  return {
    label: "✈️ Extérieur",
    className: "border border-orange-300 bg-white text-orange-600",
  };
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-orange-500 bg-orange-500 text-white shadow-[0_12px_28px_-16px_rgba(255,122,0,0.8)]"
          : "border-neutral-700 bg-neutral-900 text-white hover:border-orange-400 hover:text-orange-200"
      }`}
    >
      {children}
    </button>
  );
}

function ViewChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-orange-500 bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-[0_14px_30px_-16px_rgba(255,122,0,0.95)]"
          : "border-neutral-700 bg-neutral-900 text-white hover:border-orange-400 hover:text-orange-200"
      }`}
    >
      {children}
    </button>
  );
}

function ResultCard({ match }: { match: MatchItem }) {
  if (match.scoreTeam === null || match.scoreOpponent === null) {
    return null;
  }

  const venueBadge = getVenueBadge(match);

  const leftTeam = match.isHome ? match.team : match.opponent;
  const rightTeam = match.isHome ? match.opponent : match.team;

  const leftScore = match.isHome ? match.scoreTeam : match.scoreOpponent;
  const rightScore = match.isHome ? match.scoreOpponent : match.scoreTeam;

  const leftLabel = match.isHome ? "CSV" : "ADV";
  const rightLabel = match.isHome ? "ADV" : "CSV";

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-neutral-800 bg-neutral-950 p-4 text-white shadow-[0_18px_45px_-28px_rgba(0,0,0,0.72)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-500/60 hover:shadow-[0_24px_55px_-28px_rgba(255,122,0,0.24)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-orange-500/10 blur-2xl transition duration-300 group-hover:bg-orange-500/20" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300">
                {match.category}
              </div>

              <div
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${venueBadge.className}`}
              >
                {match.isHome ? "Domicile" : "Extérieur"}
              </div>
            </div>

            <h3 className="mt-2 text-base font-extrabold leading-tight text-white sm:text-lg">
              {leftTeam} <span className="text-white/30">vs</span> {rightTeam}
            </h3>
          </div>

          <div
            className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getResultBadgeClasses(
              match.scoreTeam,
              match.scoreOpponent,
            )}`}
          >
            {getResultLabel(match.scoreTeam, match.scoreOpponent)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[1.15rem] border border-orange-500/15 bg-white/[0.03] px-3 py-3">
          <div className="min-w-0 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">
              {leftLabel}
            </div>
            <div className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-white">
              {leftTeam}
            </div>
          </div>

          <div className="inline-flex min-w-[84px] items-center justify-center rounded-2xl border border-orange-500 bg-orange-500 px-3 py-2 text-lg font-extrabold tracking-tight text-white shadow-[0_12px_24px_-14px_rgba(255,122,0,0.9)]">
            {leftScore} - {rightScore}
          </div>

          <div className="min-w-0 text-left">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">
              {rightLabel}
            </div>
            <div className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-white">
              {rightTeam}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white/80">
            <Clock3 size={14} className="text-orange-400" />
            <span className="font-medium">{formatDate(match.matchDate)}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white/80">
            <MapPin size={14} className="text-orange-400" />
            <span className="font-medium">{match.location}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white/80">
            <Trophy size={14} className="text-orange-400" />
            <span className="font-medium">
              {match.isHome ? "Domicile" : "Extérieur"}
            </span>
          </div>
        </div>

        {match.scorers ? (
          <div className="mt-3 rounded-[1rem] border border-orange-500/15 bg-orange-500/8 px-3 py-2 text-sm text-white/80">
            <span className="font-bold text-white">Buteurs :</span>{" "}
            <span className="whitespace-pre-line">{match.scorers}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function UpcomingCard({ match }: { match: MatchItem }) {
  const venueBadge = getVenueBadge(match);
  const leftTeam = match.isHome ? match.team : match.opponent;
  const rightTeam = match.isHome ? match.opponent : match.team;

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-neutral-200 bg-white p-4 text-neutral-900 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-[0_20px_48px_-28px_rgba(255,122,0,0.24)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-orange-500/8 blur-2xl transition duration-300 group-hover:bg-orange-500/16" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-700">
                {match.category}
              </div>

              <div
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${venueBadge.className}`}
              >
                {match.isHome ? "Domicile" : "Extérieur"}
              </div>
            </div>

            <h3 className="mt-2 text-base font-extrabold leading-tight text-neutral-900 sm:text-lg">
              {leftTeam} <span className="text-neutral-400">vs</span>{" "}
              {rightTeam}
            </h3>
          </div>

          <div
            className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getUpcomingStatusClasses(
              match.status,
            )}`}
          >
            {formatStatus(match.status)}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-700">
            <CalendarDays size={14} className="text-orange-500" />
            <span className="font-medium">{formatDate(match.matchDate)}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-700">
            <MapPin size={14} className="text-orange-500" />
            <span className="font-medium">{match.location}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-700">
            <Trophy size={14} className="text-orange-500" />
            <span className="font-medium">
              {match.isHome ? "Domicile" : "Extérieur"}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-[1.05rem] border border-orange-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black px-4 py-3 text-white">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                {match.isHome ? "CSV" : "ADV"}
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-white">
                {leftTeam}
              </div>
            </div>

            <div className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-300">
              Match
            </div>

            <div className="min-w-0 text-left">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                {match.isHome ? "ADV" : "CSV"}
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-white">
                {rightTeam}
              </div>
            </div>
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
  const [activeView, setActiveView] = useState<ViewFilterKey>("all");

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

  const groupedRecentResults = useMemo(() => {
    return groupMatchesByCategory(filteredRecentResults);
  }, [filteredRecentResults]);

  const groupedUpcomingMatches = useMemo(() => {
    return groupMatchesByCategory(filteredUpcomingMatches);
  }, [filteredUpcomingMatches]);

  const showResults = activeView === "all" || activeView === "results";
  const showUpcoming = activeView === "all" || activeView === "upcoming";

  const hasVisibleResults = showResults && filteredRecentResults.length > 0;
  const hasVisibleUpcoming = showUpcoming && filteredUpcomingMatches.length > 0;
  const hasContent = hasVisibleResults || hasVisibleUpcoming;

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-[2rem] border border-neutral-800 bg-neutral-950 p-5 text-white shadow-[0_28px_70px_-35px_rgba(0,0,0,0.55)] md:p-6">
        <div className="space-y-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400">
              Filtres
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white">
              Affichage des matchs
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
              Trie rapidement les matchs du club par type d’affichage et par
              catégorie avec une interface plus forte visuellement.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-neutral-800 bg-black/30 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              Type d’affichage
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {VIEW_FILTERS.map((filter) => {
                const isActive = activeView === filter.key;

                return (
                  <ViewChip
                    key={filter.key}
                    active={isActive}
                    onClick={() => setActiveView(filter.key)}
                  >
                    {filter.label}
                  </ViewChip>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-neutral-800 bg-black/30 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              Catégories
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter.key;

                return (
                  <CategoryChip
                    key={filter.key}
                    active={isActive}
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    {filter.label}
                  </CategoryChip>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {!hasContent ? (
        <div className="rounded-[1.75rem] border border-dashed border-orange-300 bg-orange-50 p-6 text-sm text-neutral-700">
          Aucun match à afficher pour ce filtre.
        </div>
      ) : null}

      {hasVisibleResults ? (
        <section className="space-y-6">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
              Résultats
            </div>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">
              Résultats récents
            </h2>
          </div>

          <div className="space-y-8">
            {groupedRecentResults.map((group) => (
              <section key={group.category} className="space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-neutral-900 md:text-xl">
                      {group.category}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {group.items.length} match
                      {group.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {group.items.map((match) => (
                    <ResultCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      {hasVisibleUpcoming ? (
        <section className="space-y-6">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
              À venir
            </div>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">
              Prochains matchs du week-end
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-700 md:text-base">
              Les rencontres à venir du club, regroupées par catégorie pour une
              lecture plus claire.
            </p>
          </div>

          <div className="space-y-8">
            {groupedUpcomingMatches.map((group) => (
              <section key={group.category} className="space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-neutral-900 md:text-xl">
                      {group.category}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {group.items.length} match
                      {group.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {group.items.map((match) => (
                    <UpcomingCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
