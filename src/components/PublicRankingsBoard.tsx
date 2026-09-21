"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PlayerPortrait from "@/components/ui/PlayerPortrait";
import {
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Goal,
  Loader2,
  MapPin,
  Trophy,
} from "lucide-react";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  team?: string | null;
  category?: string | null;
  photoUrl?: string | null;
  photoConsent?: boolean | null;
  goals: number;
  assists: number;
};

type RankingPreviewLine = {
  rank: number;
  team: string;
  points: number | null;
  isClub: boolean;
};

type RankingPreviewState = {
  status: "idle" | "loading" | "success" | "error";
  rows: RankingPreviewLine[];
};

type OfficialTeamRanking = {
  label: string;
  category: string;
  level: string;
  url?: string | null;
};

type SeasonSummary = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

type SeasonResult = {
  id: string;
  category: string;
  team: string;
  opponent: string;
  matchDate: string;
  location: string;
  isHome: boolean;
  scoreTeam: number | null;
  scoreOpponent: number | null;
  penaltyScoreTeam: number | null;
  penaltyScoreOpponent: number | null;
};

type UpcomingSeasonMatch = {
  id: string;
  category: string;
  team: string;
  opponent: string;
  matchDate: string;
  location: string;
  isHome: boolean;
  status: string;
};

type Props = {
  season: string;
  players: Player[];
  fffClubUrl: string;
  officialTeamRankings: OfficialTeamRanking[];
  seasonSummary: SeasonSummary;
  recentResults: SeasonResult[];
  upcomingMatches: UpcomingSeasonMatch[];
};

type MainTab = "overview" | "results" | "stats" | "rankings";

const MAIN_TABS: Array<{ id: MainTab; label: string }> = [
  { id: "overview", label: "Vue d’ensemble" },
  { id: "results", label: "Résultats" },
  { id: "stats", label: "Buteurs / Passeurs" },
  { id: "rankings", label: "Classements FFF" },
];

function RankingPreview({
  state,
  hasUrl,
}: {
  state?: RankingPreviewState;
  hasUrl: boolean;
}) {
  if (!hasUrl) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-5 text-sm text-neutral-500">
        Lien classement à renseigner dans l’administration.
      </div>
    );
  }

  if (!state || state.status === "idle" || state.status === "loading") {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-4 py-5 text-sm font-medium text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Chargement du classement FFF…
      </div>
    );
  }

  if (state.status === "error" || state.rows.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-neutral-100 bg-white px-4 py-5 text-sm text-neutral-500">
        Aperçu indisponible pour le moment. Le lien FFF reste accessible.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-100 bg-white">
      <div className="grid grid-cols-[42px_1fr_52px] border-b border-neutral-100 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-neutral-400">
        <span>#</span>
        <span>Équipe</span>
        <span className="text-right">Pts</span>
      </div>
      <div className="divide-y divide-neutral-100">
        {state.rows.map((row) => (
          <div
            key={`${row.rank}-${row.team}`}
            className={`grid grid-cols-[42px_1fr_52px] items-center px-4 py-3 text-sm transition ${
              row.isClub
                ? "bg-orange-50 font-black text-orange-700"
                : "bg-white text-neutral-700"
            }`}
          >
            <span>{row.rank}</span>
            <span className="truncate">{row.team}</span>
            <span className="text-right font-black">{row.points ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatSeasonMatchDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function getSeasonResultOutcome(match: SeasonResult) {
  const teamScore = match.scoreTeam ?? 0;
  const opponentScore = match.scoreOpponent ?? 0;

  if (teamScore > opponentScore) return "win" as const;
  if (teamScore < opponentScore) return "loss" as const;

  if (
    match.penaltyScoreTeam !== null &&
    match.penaltyScoreOpponent !== null &&
    match.penaltyScoreTeam !== match.penaltyScoreOpponent
  ) {
    return match.penaltyScoreTeam > match.penaltyScoreOpponent
      ? ("win" as const)
      : ("loss" as const);
  }

  return "draw" as const;
}

function ResultBadge({ outcome }: { outcome: "win" | "draw" | "loss" }) {
  const styles = {
    win: "border-emerald-200 bg-emerald-50 text-emerald-700",
    draw: "border-neutral-200 bg-white text-neutral-600",
    loss: "border-red-200 bg-red-50 text-red-700",
  }[outcome];
  const label = { win: "Victoire", draw: "Nul", loss: "Défaite" }[outcome];

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${styles}`}>
      {label}
    </span>
  );
}

function SeasonMatchTeams({
  team,
  opponent,
  isHome,
}: {
  team: string;
  opponent: string;
  isHome: boolean;
}) {
  return (
    <div className="font-black text-neutral-950">
      {isHome ? team : opponent}
      <span className="mx-2 font-medium text-neutral-300">—</span>
      {isHome ? opponent : team}
    </div>
  );
}

function ResultCard({ match }: { match: SeasonResult }) {
  const leftScore = match.isHome ? match.scoreTeam : match.scoreOpponent;
  const rightScore = match.isHome ? match.scoreOpponent : match.scoreTeam;
  const leftPenalty = match.isHome
    ? match.penaltyScoreTeam
    : match.penaltyScoreOpponent;
  const rightPenalty = match.isHome
    ? match.penaltyScoreOpponent
    : match.penaltyScoreTeam;
  const hasPenalties = leftPenalty !== null && rightPenalty !== null;

  return (
    <article className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-orange-700">
              {match.team}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-500 ring-1 ring-neutral-200">
              {match.isHome ? "Domicile" : "Extérieur"}
            </span>
          </div>
          <SeasonMatchTeams team={match.team} opponent={match.opponent} isHome={match.isHome} />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
              {formatSeasonMatchDate(match.matchDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              {match.location}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ResultBadge outcome={getSeasonResultOutcome(match)} />
          <div className="rounded-2xl bg-neutral-950 px-4 py-2 text-xl font-black text-white">
            {leftScore} - {rightScore}
            {hasPenalties && (
              <div className="mt-0.5 text-center text-[10px] font-black uppercase tracking-wide text-orange-300">
                TAB {leftPenalty} - {rightPenalty}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function UpcomingCard({ match }: { match: UpcomingSeasonMatch }) {
  return (
    <article className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              {match.team}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-500 ring-1 ring-orange-100">
              {match.isHome ? "Domicile" : "Extérieur"}
            </span>
          </div>
          <SeasonMatchTeams team={match.team} opponent={match.opponent} isHome={match.isHome} />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
              {formatSeasonMatchDate(match.matchDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              {match.location}
            </span>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-200">
          {match.status === "postponed" ? "Reporté" : "Programmé"}
        </span>
      </div>
    </article>
  );
}

function PlayerRankingCard({
  player,
  index,
  stat,
}: {
  player: Player;
  index: number;
  stat: "goals" | "assists";
}) {
  const value = stat === "goals" ? player.goals : player.assists;
  const accent = stat === "goals" ? "text-orange-600" : "text-sky-600";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
      <div className="flex min-w-0 items-center gap-4">
        {player.photoConsent && player.photoUrl ? (
          <div className="relative shrink-0">
            <PlayerPortrait
              src={player.photoUrl}
              alt={`${player.firstName} ${player.lastName}`}
              className="h-14 w-14 rounded-2xl"
            />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-neutral-950 px-1.5 py-0.5 text-[9px] font-black text-white">
              #{index + 1}
            </span>
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
            #{index + 1}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate font-bold text-neutral-950">
            {player.firstName} {player.lastName}
          </div>
          <div className="text-sm text-neutral-500">{player.team}</div>
        </div>
      </div>
      <div className="ml-4 text-right">
        <div className={`text-2xl font-black ${accent}`}>{value}</div>
        <div className="text-xs uppercase tracking-wide text-neutral-400">
          {stat === "goals" ? "buts" : "passes"}
        </div>
      </div>
    </div>
  );
}

export default function PublicRankingsBoard({
  season,
  players,
  fffClubUrl,
  officialTeamRankings,
  seasonSummary,
  recentResults,
  upcomingMatches,
}: Props) {
  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [selectedStatsCategory, setSelectedStatsCategory] = useState("Toutes");
  const [selectedRankingCategory, setSelectedRankingCategory] = useState("Toutes");
  const [selectedRankingTeam, setSelectedRankingTeam] = useState(
    officialTeamRankings[0]?.label || "",
  );
  const [rankingPreviews, setRankingPreviews] = useState<Record<string, RankingPreviewState>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab") as MainTab | null;
    if (requestedTab && MAIN_TABS.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
    const requestedTeam = params.get("team");
    if (requestedTeam && officialTeamRankings.some((team) => team.label === requestedTeam)) {
      setSelectedRankingTeam(requestedTeam);
    }
  }, [officialTeamRankings]);

  const changeTab = (tab: MainTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  const rankingCategories = useMemo(() => {
    const values = new Set(officialTeamRankings.map((team) => team.category).filter(Boolean));
    return ["Toutes", ...Array.from(values)];
  }, [officialTeamRankings]);

  const statsCategories = useMemo(() => {
    const values = new Set<string>();
    players.forEach((player) => {
      if (player.category) values.add(player.category);
      if (player.team) values.add(player.team);
    });
    return ["Toutes", ...Array.from(values)];
  }, [players]);

  const filteredPlayers =
    selectedStatsCategory === "Toutes"
      ? players
      : players.filter(
          (player) =>
            player.category === selectedStatsCategory || player.team === selectedStatsCategory,
        );

  const topScorers = [...filteredPlayers]
    .filter((player) => player.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);
  const topAssists = [...filteredPlayers]
    .filter((player) => player.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 10);

  const filteredOfficialTeamRankings = useMemo(
    () =>
      selectedRankingCategory === "Toutes"
        ? officialTeamRankings
        : officialTeamRankings.filter((team) => team.category === selectedRankingCategory),
    [officialTeamRankings, selectedRankingCategory],
  );

  useEffect(() => {
    if (
      !filteredOfficialTeamRankings.some((team) => team.label === selectedRankingTeam)
    ) {
      setSelectedRankingTeam(filteredOfficialTeamRankings[0]?.label || "");
    }
  }, [filteredOfficialTeamRankings, selectedRankingTeam]);

  const selectedRanking = officialTeamRankings.find(
    (team) => team.label === selectedRankingTeam,
  );

  useEffect(() => {
    if (activeTab !== "rankings" || !selectedRanking?.url) return;
    if (rankingPreviews[selectedRanking.label]?.status) return;

    const label = selectedRanking.label;
    const url = selectedRanking.url;
    setRankingPreviews((current) => ({
      ...current,
      [label]: { status: "loading", rows: [] },
    }));

    fetch(`/api/fff-ranking?url=${encodeURIComponent(url)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Classement indisponible");
        return response.json();
      })
      .then((data: { rows?: RankingPreviewLine[] }) => {
        setRankingPreviews((current) => ({
          ...current,
          [label]: { status: "success", rows: data.rows || [] },
        }));
      })
      .catch(() => {
        setRankingPreviews((current) => ({
          ...current,
          [label]: { status: "error", rows: [] },
        }));
      });
  }, [activeTab, selectedRanking, rankingPreviews]);

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-8 text-white shadow-2xl md:px-10 md:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
              Saison {season}
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Le club en chiffres</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300 md:text-base">
              Résultats, statistiques individuelles et classements officiels, sans avoir à parcourir toute la page.
            </p>
          </div>
          <Link
            href={fffClubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
          >
            Site officiel FFF <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <nav className="sticky top-20 z-20 rounded-[1.5rem] border border-neutral-200 bg-white/95 p-2 shadow-lg backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => changeTab(tab.id)}
              className={`min-w-max rounded-2xl px-4 py-3 text-sm font-black transition md:min-w-0 ${
                activeTab === tab.id
                  ? "bg-neutral-950 text-white shadow-md"
                  : "bg-neutral-50 text-neutral-600 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "overview" && (
        <div className="space-y-7">
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.6rem] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Matchs joués</div>
                <div className="mt-3 text-4xl font-black text-neutral-950">{seasonSummary.played}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">{seasonSummary.wins} V</span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600">{seasonSummary.draws} N</span>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">{seasonSummary.losses} D</span>
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Buts marqués</div>
                <div className="mt-3 text-4xl font-black text-orange-600">{seasonSummary.goalsFor}</div>
                <div className="mt-3 text-sm font-semibold text-neutral-500">
                  {seasonSummary.played ? `${(seasonSummary.goalsFor / seasonSummary.played).toFixed(1)} par match` : "La saison démarre"}
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Buts encaissés</div>
                <div className="mt-3 text-4xl font-black text-neutral-950">{seasonSummary.goalsAgainst}</div>
                <div className="mt-3 text-sm font-semibold text-neutral-500">
                  Différence {seasonSummary.goalsFor - seasonSummary.goalsAgainst >= 0 ? "+" : ""}{seasonSummary.goalsFor - seasonSummary.goalsAgainst}
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-orange-200 bg-orange-50 p-5">
                <div className="text-xs font-black uppercase tracking-wide text-orange-600">À suivre</div>
                <div className="mt-3 text-4xl font-black text-neutral-950">{upcomingMatches.length}</div>
                <div className="mt-3 text-sm font-semibold text-neutral-600">match{upcomingMatches.length > 1 ? "s" : ""} du week-end</div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">En bref</div>
                  <h2 className="mt-2 text-2xl font-black text-neutral-950">Derniers résultats</h2>
                </div>
                <button type="button" onClick={() => changeTab("results")} className="text-sm font-black text-orange-600">Tout voir →</button>
              </div>
              <div className="mt-5 space-y-3">
                {recentResults.slice(0, 3).map((match) => <ResultCard key={match.id} match={match} />)}
                {!recentResults.length && <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">Aucun résultat sur le week-end.</div>}
              </div>
            </section>

            <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">À venir</div>
                  <h2 className="mt-2 text-2xl font-black text-neutral-950">Prochains matchs</h2>
                </div>
                <button type="button" onClick={() => changeTab("results")} className="text-sm font-black text-orange-600">Tout voir →</button>
              </div>
              <div className="mt-5 space-y-3">
                {upcomingMatches.slice(0, 3).map((match) => <UpcomingCard key={match.id} match={match} />)}
                {!upcomingMatches.length && <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-6 text-center text-sm text-neutral-500">Aucun match programmé ce week-end.</div>}
              </div>
            </section>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button type="button" onClick={() => changeTab("stats")} className="rounded-[1.6rem] border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Statistiques joueurs</div>
              <div className="mt-2 text-xl font-black text-neutral-950">Voir les buteurs et passeurs →</div>
            </button>
            <button type="button" onClick={() => changeTab("rankings")} className="rounded-[1.6rem] border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Compétitions</div>
              <div className="mt-2 text-xl font-black text-neutral-950">Consulter un classement FFF →</div>
            </button>
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Week-end</div>
                <h2 className="mt-2 text-2xl font-black text-neutral-950">Résultats</h2>
              </div>
              <Link href="/calendrier" className="text-sm font-black text-orange-600">Calendrier →</Link>
            </div>
            <div className="mt-6 space-y-3">
              {recentResults.map((match) => <ResultCard key={match.id} match={match} />)}
              {!recentResults.length && <div className="rounded-2xl border border-dashed border-neutral-200 p-7 text-center text-sm font-semibold text-neutral-500">Aucun résultat enregistré ce week-end.</div>}
            </div>
          </section>

          <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">À venir</div>
                <h2 className="mt-2 text-2xl font-black text-neutral-950">Prochains matchs</h2>
              </div>
              <Link href="/calendrier" className="text-sm font-black text-orange-600">Calendrier →</Link>
            </div>
            <div className="mt-6 space-y-3">
              {upcomingMatches.map((match) => <UpcomingCard key={match.id} match={match} />)}
              {!upcomingMatches.length && <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-7 text-center text-sm font-semibold text-neutral-500">Aucun match programmé ce week-end.</div>}
            </div>
          </section>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Leaders de la saison</div>
                <h2 className="mt-2 text-2xl font-black text-neutral-950">Buteurs / passeurs</h2>
              </div>
              <select value={selectedStatsCategory} onChange={(event) => setSelectedStatsCategory(event.target.value)} className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 outline-none transition focus:border-orange-400">
                {statsCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-orange-600"><Goal className="h-5 w-5" /></div>
                <div><h2 className="text-2xl font-black text-neutral-950">Meilleurs buteurs</h2><p className="text-sm text-neutral-500">Top scoreurs du club</p></div>
              </div>
              <div className="mt-6 space-y-3">
                {topScorers.map((player, index) => <PlayerRankingCard key={player.id} player={player} index={index} stat="goals" />)}
                {!topScorers.length && <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-5 py-8 text-center text-sm text-neutral-500">Aucun buteur pour ce filtre.</div>}
                <Link href="/classements/buteurs" className="inline-flex w-full items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-100">Voir tous les buteurs</Link>
              </div>
            </section>

            <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-600"><Trophy className="h-5 w-5" /></div>
                <div><h2 className="text-2xl font-black text-neutral-950">Meilleurs passeurs</h2><p className="text-sm text-neutral-500">Top passeurs du club</p></div>
              </div>
              <div className="mt-6 space-y-3">
                {topAssists.map((player, index) => <PlayerRankingCard key={player.id} player={player} index={index} stat="assists" />)}
                {!topAssists.length && <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-5 py-8 text-center text-sm text-neutral-500">Aucune passe décisive pour ce filtre.</div>}
                <Link href="/classements/passeurs" className="inline-flex w-full items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-700 transition hover:bg-sky-100">Voir tous les passeurs</Link>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === "rankings" && (
        <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Compétitions officielles</div>
              <h2 className="mt-2 text-2xl font-black text-neutral-950">Classements FFF</h2>
              <p className="mt-1 text-sm text-neutral-500">Choisis une équipe : un seul classement est chargé et affiché à la fois.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {rankingCategories.map((category) => (
                <button key={category} type="button" onClick={() => setSelectedRankingCategory(category)} className={`rounded-full px-4 py-2 text-xs font-black transition ${selectedRankingCategory === category ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-orange-50 hover:text-orange-700"}`}>{category}</button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {filteredOfficialTeamRankings.map((team) => (
              <button
                key={team.label}
                type="button"
                onClick={() => {
                  setSelectedRankingTeam(team.label);
                  const params = new URLSearchParams(window.location.search);
                  params.set("tab", "rankings");
                  params.set("team", team.label);
                  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
                }}
                className={`min-w-max rounded-2xl border px-4 py-3 text-sm font-black transition ${selectedRankingTeam === team.label ? "border-orange-500 bg-orange-500 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-orange-200 hover:bg-orange-50"}`}
              >
                {team.label}
              </button>
            ))}
          </div>

          {selectedRanking ? (
            <article className="mt-5 rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">{selectedRanking.category}</span>
                  <h3 className="mt-4 text-3xl font-black text-neutral-950">{selectedRanking.label}</h3>
                  <p className="mt-2 text-sm text-neutral-500">{selectedRanking.level}</p>
                </div>
                <a href={selectedRanking.url || fffClubUrl} target="_blank" rel="noreferrer" aria-label={`Voir le classement FFF ${selectedRanking.label}`} className="rounded-2xl bg-white p-3 text-neutral-950 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-950 hover:text-white"><ExternalLink className="h-5 w-5" /></a>
              </div>
              <RankingPreview state={rankingPreviews[selectedRanking.label]} hasUrl={Boolean(selectedRanking.url)} />
              <a href={selectedRanking.url || fffClubUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-orange-600 transition hover:text-orange-700">Voir le classement FFF <ChevronRight className="h-4 w-4" /></a>
            </article>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">Aucune équipe disponible dans ce filtre.</div>
          )}
        </section>
      )}
    </div>
  );
}
