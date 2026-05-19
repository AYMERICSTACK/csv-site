"use client";

import Link from "next/link";
import MatchCardActions from "@/app/admin/matchs/MatchCardActions";
import {
  CalendarDays,
  Clock3,
  Filter,
  MapPin,
  Search,
  Shield,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";

const DISPLAY_TIME_ZONE = "Europe/Paris";

type MatchItem = {
  id: string;
  category: string;
  team: string;
  opponent: string;
  matchDate: Date | string;
  location: string;
  isHome: boolean;
  status: string;
  scoreTeam: number | null;
  scoreOpponent: number | null;
  scorers: string | null;
};

type TabKey = "all" | "upcoming" | "finished" | "cancelled";

type Props = {
  matches: MatchItem[];
  deleteAction: (formData: FormData) => Promise<void>;
};

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: DISPLAY_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatShortDate(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: DISPLAY_TIME_ZONE,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatStatus(status: string) {
  switch (status) {
    case "scheduled":
      return "À venir";
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

function getStatusClasses(status: string) {
  switch (status) {
    case "scheduled":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "postponed":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    case "finished":
      return "border-green-200 bg-green-50 text-green-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function formatScore(scoreTeam: number | null, scoreOpponent: number | null) {
  if (scoreTeam === null || scoreOpponent === null) return "—";
  return `${scoreTeam} - ${scoreOpponent}`;
}

function isUpcoming(match: MatchItem) {
  return match.status !== "finished" && match.status !== "cancelled";
}

export default function AdminMatchesBoard({ matches, deleteAction }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: matches.length,
      upcoming: matches.filter(isUpcoming).length,
      finished: matches.filter((match) => match.status === "finished").length,
      cancelled: matches.filter((match) => match.status === "cancelled").length,
    }),
    [matches],
  );

  const filteredMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return matches.filter((match) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "upcoming" && isUpcoming(match)) ||
        (activeTab === "finished" && match.status === "finished") ||
        (activeTab === "cancelled" && match.status === "cancelled");

      if (!matchesTab) return false;
      if (!normalizedQuery) return true;

      return [match.category, match.team, match.opponent, match.location]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeTab, matches, query]);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "Tous", count: counts.all },
    { key: "upcoming", label: "À venir", count: counts.upcoming },
    { key: "finished", label: "Terminés", count: counts.finished },
    { key: "cancelled", label: "Annulés", count: counts.cancelled },
  ];

  return (
    <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900">
            Matchs enregistrés
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Filtre rapidement les rencontres et ouvre une fiche pour modifier
            score, buteurs ou passeurs.
          </p>
        </div>

        <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-neutral-900">
          {matches.length} match{matches.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus-within:border-orange-300 focus-within:bg-white">
          <Search size={16} className="text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une équipe, un adversaire, un lieu..."
            className="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:font-medium placeholder:text-neutral-400"
          />
        </label>

        <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-1">
          <Filter size={15} className="ml-2 hidden text-neutral-400 sm:block" />
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                  isActive
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-white hover:text-neutral-950"
                }`}
              >
                {tab.label} <span className="opacity-70">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm font-semibold text-neutral-600">
          Aucun match ne correspond à ce filtre.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredMatches.map((match) => (
            <article
              key={match.id}
              className="group overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >
              <div className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-neutral-600">
                      {match.category}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${getStatusClasses(match.status)}`}
                    >
                      {formatStatus(match.status)}
                    </span>
                    <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-orange-700">
                      {match.isHome ? "Domicile" : "Extérieur"}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500">
                    <CalendarDays size={14} />
                    {formatShortDate(match.matchDate)}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide text-neutral-400">
                        CS Viriat
                      </div>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950">
                        {match.team}
                      </h3>
                    </div>

                    <div className="rounded-[1.25rem] border border-neutral-200 bg-neutral-950 px-5 py-3 text-center text-white shadow-sm">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wide text-white/55">
                        <Trophy size={13} /> Score
                      </div>
                      <div className="mt-1 text-3xl font-black tracking-tight">
                        {formatScore(match.scoreTeam, match.scoreOpponent)}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="text-xs font-black uppercase tracking-wide text-neutral-400">
                        Adversaire
                      </div>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950">
                        {match.opponent}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <Clock3 size={16} className="mt-0.5 text-neutral-500" />
                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">
                          Date
                        </div>
                        <div className="mt-1 text-sm font-bold text-neutral-900">
                          {formatDate(match.matchDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <MapPin size={16} className="mt-0.5 text-neutral-500" />
                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">
                          Lieu
                        </div>
                        <div className="mt-1 text-sm font-bold text-neutral-900">
                          {match.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {match.scorers ? (
                    <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                      <div className="text-xs font-black uppercase tracking-wide text-orange-700">
                        ⚽ Buteurs
                      </div>
                      <div className="mt-1 whitespace-pre-line text-sm font-extrabold text-neutral-950">
                        {match.scorers}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-col gap-3 lg:w-52">
                  <MatchCardActions
                    matchId={match.id}
                    deleteAction={deleteAction}
                  />

                  <Link
                    href={`/admin/matchs/${match.id}/edit`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-extrabold text-neutral-800 transition hover:bg-neutral-100"
                  >
                    <Shield size={15} />
                    Ouvrir la fiche
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
