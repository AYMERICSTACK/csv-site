"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, Trophy } from "lucide-react";
import PlateauPublicCard, { type PlateauPublicItem } from "@/components/PlateauPublicCard";

type HomeMatch = {
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
  competitionKey: string;
  competitionLabel: string;
  competitionType: string;
  roundLabel: string | null;
};

type FilterKey = "all" | "ecole" | "jeunes" | "seniors";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tous" },
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

function getCategoryGroup(match: HomeMatch): FilterKey {
  const value = normalize(`${match.category} ${match.team}`);

  if (value.includes("senior") || value.includes("veteran") || value.includes("femin")) {
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
    value.includes("plateau") ||
    value.includes("foot animation")
  ) {
    return "ecole";
  }

  if (/\bu(?:12|13|14|15|16|17|18|19|20)\b/.test(value) || value.includes("jeune")) {
    return "jeunes";
  }

  return "all";
}

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function formatDay(dateValue: string) {
  const raw = new Date(dateValue).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getDayKey(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-CA", {
    timeZone: "Europe/Paris",
  });
}

function formatStatus(status: string) {
  switch (status) {
    case "scheduled": return "Programmé";
    case "postponed": return "Reporté";
    case "cancelled": return "Annulé";
    case "finished": return "Terminé";
    default: return status;
  }
}

function getResultLabel(scoreTeam: number, scoreOpponent: number) {
  if (scoreTeam > scoreOpponent) return "Victoire";
  if (scoreTeam < scoreOpponent) return "Défaite";
  return "Nul";
}

function getResultBadgeClasses(scoreTeam: number, scoreOpponent: number) {
  if (scoreTeam > scoreOpponent) return "border border-green-300 bg-green-100 text-green-800";
  if (scoreTeam < scoreOpponent) return "border border-red-300 bg-red-100 text-red-800";
  return "border border-orange-300 bg-orange-100 text-orange-800";
}

function getUpcomingStatusClasses(status: string) {
  switch (status) {
    case "scheduled": return "border border-blue-300 bg-blue-100 text-blue-800";
    case "postponed": return "border border-orange-300 bg-orange-100 text-orange-800";
    case "cancelled": return "border border-red-300 bg-red-100 text-red-800";
    default: return "border border-neutral-300 bg-neutral-100 text-neutral-700";
  }
}

function getVenueBadge(match: HomeMatch) {
  return match.isHome
    ? { label: "Domicile", className: "border border-orange-500 bg-orange-500 text-white" }
    : { label: "Extérieur", className: "border border-orange-300 bg-white text-orange-600" };
}

function getCompetitionBadgeLabel(match: HomeMatch) {
  const label = match.competitionLabel?.trim() || "Championnat";
  const round = match.roundLabel?.trim();
  return round ? `${label} · ${round}` : label;
}

function getUpcomingCompetitionBadgeClasses(match: HomeMatch) {
  if (match.competitionType === "cup") return "border border-violet-200 bg-violet-50 text-violet-700";
  if (match.competitionType === "friendly") return "border border-sky-200 bg-sky-50 text-sky-700";
  return "border border-neutral-200 bg-neutral-50 text-neutral-700";
}

function getResultCompetitionBadgeClasses(match: HomeMatch) {
  if (match.competitionType === "cup") return "border border-violet-500/35 bg-violet-500/12 text-violet-200";
  if (match.competitionType === "friendly") return "border border-sky-500/35 bg-sky-500/12 text-sky-200";
  return "border border-white/15 bg-white/8 text-white/75";
}

function ResultCard({ match }: { match: HomeMatch }) {
  if (match.scoreTeam === null || match.scoreOpponent === null) return null;

  const venueBadge = getVenueBadge(match);
  const leftTeam = match.isHome ? match.team : match.opponent;
  const rightTeam = match.isHome ? match.opponent : match.team;
  const leftScore = match.isHome ? match.scoreTeam : match.scoreOpponent;
  const rightScore = match.isHome ? match.scoreOpponent : match.scoreTeam;

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-neutral-800 bg-neutral-950 p-4 text-white shadow-[0_18px_45px_-28px_rgba(0,0,0,0.72)] transition hover:-translate-y-0.5 hover:border-orange-500/60">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300">{match.category}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${venueBadge.className}`}>{venueBadge.label}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${getResultCompetitionBadgeClasses(match)}`}>{getCompetitionBadgeLabel(match)}</span>
            </div>
            <h3 className="mt-2 text-base font-extrabold leading-tight sm:text-lg">{leftTeam} <span className="text-white/30">vs</span> {rightTeam}</h3>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getResultBadgeClasses(match.scoreTeam, match.scoreOpponent)}`}>{getResultLabel(match.scoreTeam, match.scoreOpponent)}</span>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[1.15rem] border border-orange-500/15 bg-white/[0.03] px-3 py-3">
          <div className="min-w-0 text-right text-sm font-extrabold">{leftTeam}</div>
          <div className="rounded-2xl border border-orange-500 bg-orange-500 px-3 py-2 text-lg font-extrabold">{leftScore} - {rightScore}</div>
          <div className="min-w-0 text-left text-sm font-extrabold">{rightTeam}</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white/80"><Clock3 size={14} className="text-orange-400" />{formatDate(match.matchDate)}</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white/80"><MapPin size={14} className="text-orange-400" />{match.location}</span>
        </div>
      </div>
    </article>
  );
}

function UpcomingCard({ match }: { match: HomeMatch }) {
  const venueBadge = getVenueBadge(match);
  const leftTeam = match.isHome ? match.team : match.opponent;
  const rightTeam = match.isHome ? match.opponent : match.team;

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-neutral-200 bg-white p-4 text-neutral-900 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-orange-400">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-700">{match.category}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${venueBadge.className}`}>{venueBadge.label}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${getUpcomingCompetitionBadgeClasses(match)}`}>{getCompetitionBadgeLabel(match)}</span>
            </div>
            <h3 className="mt-2 text-base font-extrabold leading-tight sm:text-lg">{leftTeam} <span className="text-neutral-400">vs</span> {rightTeam}</h3>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getUpcomingStatusClasses(match.status)}`}>{formatStatus(match.status)}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-700"><CalendarDays size={14} className="text-orange-500" />{formatDate(match.matchDate)}</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-700"><MapPin size={14} className="text-orange-500" />{match.location}</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-700"><Trophy size={14} className="text-orange-500" />{venueBadge.label}</span>
        </div>

        <div className="mt-4 rounded-[1.05rem] border border-orange-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black px-4 py-3 text-white">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0 text-right text-sm font-extrabold">{leftTeam}</div>
            <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-300">Match</span>
            <div className="min-w-0 text-left text-sm font-extrabold">{rightTeam}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HomeWeekendMatchesClient({ matches, plateaux }: { matches: HomeMatch[]; plateaux: PlateauPublicItem[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredMatches = useMemo(
    () => matches.filter((match) => activeFilter === "all" || getCategoryGroup(match) === activeFilter),
    [matches, activeFilter],
  );

  const filteredPlateaux = useMemo(
    () => (activeFilter === "all" || activeFilter === "ecole" ? plateaux : []),
    [plateaux, activeFilter],
  );

  type WeekendEvent =
    | { kind: "match"; id: string; date: string; match: HomeMatch }
    | { kind: "plateau"; id: string; date: string; plateau: PlateauPublicItem };

  const dayGroups = useMemo(() => {
    const groups = new Map<string, WeekendEvent[]>();
    const events: WeekendEvent[] = [
      ...filteredMatches.map((match) => ({ kind: "match" as const, id: match.id, date: match.matchDate, match })),
      ...filteredPlateaux.map((plateau) => ({ kind: "plateau" as const, id: plateau.id, date: plateau.eventDate, plateau })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const event of events) {
      const key = getDayKey(event.date);
      const current = groups.get(key) || [];
      current.push(event);
      groups.set(key, current);
    }

    return Array.from(groups.entries()).map(([key, items]) => ({ key, items }));
  }, [filteredMatches, filteredPlateaux]);

  const total = filteredMatches.length + filteredPlateaux.length;
  const summary = [
    filteredMatches.length ? `${filteredMatches.length} match${filteredMatches.length > 1 ? "s" : ""}` : "",
    filteredPlateaux.length ? `${filteredPlateaux.length} plateau${filteredPlateaux.length > 1 ? "x" : ""}` : "",
  ].filter(Boolean).join(" · ");

  return (
    <>
      <div className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-extrabold text-neutral-900">{summary || "Aucun événement"} ce week-end</div>
          <div className="mt-1 text-xs text-neutral-500">Filtre le programme sans quitter la page d’accueil.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                activeFilter === filter.key
                  ? "border-orange-500 bg-orange-500 text-white shadow-[0_10px_24px_-14px_rgba(255,122,0,0.85)]"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-orange-300 hover:text-orange-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-5 text-sm text-neutral-700">Aucun match ou plateau pour ce filtre ce week-end.</div>
      ) : (
        <div className="mt-8 space-y-10">
          {dayGroups.map((group) => (
            <section key={group.key}>
              <div className="mb-4 flex items-end justify-between gap-3 border-b border-neutral-200 pb-3">
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">{formatDay(group.items[0].date)}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{group.items.length} événement{group.items.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((event) =>
                  event.kind === "plateau" ? (
                    <PlateauPublicCard key={`plateau-${event.id}`} plateau={event.plateau} />
                  ) : event.match.scoreTeam !== null && event.match.scoreOpponent !== null ? (
                    <ResultCard key={`match-${event.id}`} match={event.match} />
                  ) : (
                    <UpcomingCard key={`match-${event.id}`} match={event.match} />
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
