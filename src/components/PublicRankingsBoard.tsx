"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  Goal,
  Loader2,
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

type Props = {
  season: string;
  players: Player[];
  fffClubUrl: string;
  officialTeamRankings: OfficialTeamRanking[];
};

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

export default function PublicRankingsBoard({
  season,
  players,
  fffClubUrl,
  officialTeamRankings,
}: Props) {
  const [selectedRankingCategory, setSelectedRankingCategory] = useState("Toutes");
  const [selectedStatsCategory, setSelectedStatsCategory] = useState("Toutes");
  const [rankingPreviews, setRankingPreviews] = useState<
    Record<string, RankingPreviewState>
  >({});

  useEffect(() => {
    officialTeamRankings.forEach((team) => {
      if (!team.url) {
        return;
      }

      setRankingPreviews((current) => {
        if (current[team.label]?.status) {
          return current;
        }

        return {
          ...current,
          [team.label]: { status: "loading", rows: [] },
        };
      });

      fetch(`/api/fff-ranking?url=${encodeURIComponent(team.url)}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Classement indisponible");
          }

          return response.json();
        })
        .then((data: { rows?: RankingPreviewLine[] }) => {
          setRankingPreviews((current) => ({
            ...current,
            [team.label]: {
              status: "success",
              rows: data.rows || [],
            },
          }));
        })
        .catch(() => {
          setRankingPreviews((current) => ({
            ...current,
            [team.label]: { status: "error", rows: [] },
          }));
        });
    });
  }, [officialTeamRankings]);

  const rankingCategories = useMemo(() => {
    const values = new Set<string>();

    officialTeamRankings.forEach((team) => {
      if (team.category) {
        values.add(team.category);
      }
    });

    return ["Toutes", ...Array.from(values)];
  }, [officialTeamRankings]);

  const statsCategories = useMemo(() => {
    const values = new Set<string>();

    players.forEach((player) => {
      if (player.category) {
        values.add(player.category);
      }

      if (player.team) {
        values.add(player.team);
      }
    });

    return ["Toutes", ...Array.from(values)];
  }, [players]);

  const filteredPlayers =
    selectedStatsCategory === "Toutes"
      ? players
      : players.filter(
          (player) =>
            player.category === selectedStatsCategory ||
            player.team === selectedStatsCategory,
        );

  const topScorers = [...filteredPlayers]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);

  const topAssists = [...filteredPlayers]
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 10);

  const filteredOfficialTeamRankings =
    selectedRankingCategory === "Toutes"
      ? officialTeamRankings
      : officialTeamRankings.filter(
          (team) => team.category === selectedRankingCategory,
        );

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-10 text-white shadow-2xl md:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
              Saison {season}
            </span>

            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
              Classements du club
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-300">
              Retrouvez les meilleurs buteurs, passeurs et les accès rapides
              vers les classements officiels FFF des équipes du CS Viriat.
            </p>
          </div>

          <Link
            href={fffClubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
          >
            Site officiel FFF
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-neutral-950">
              Classements FFF
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Accès rapide aux classements officiels des équipes du club.
            </p>
          </div>

          <select
            value={selectedRankingCategory}
            onChange={(event) => setSelectedRankingCategory(event.target.value)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 outline-none transition focus:border-orange-400"
          >
            {rankingCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredOfficialTeamRankings.map((team) => (
            <article
              key={team.label}
              className="group rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:bg-white hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
                    {team.category}
                  </span>

                  <h3 className="mt-4 text-2xl font-black text-neutral-950">
                    {team.label}
                  </h3>

                  <p className="mt-2 text-sm text-neutral-500">{team.level}</p>
                </div>

                <a
                  href={team.url || fffClubUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Voir le classement FFF ${team.label}`}
                  className="rounded-2xl bg-white p-3 text-neutral-950 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-950 hover:text-white"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>

              <RankingPreview
                state={rankingPreviews[team.label]}
                hasUrl={Boolean(team.url)}
              />

              <a
                href={team.url || fffClubUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-black text-orange-600 transition hover:text-orange-700"
              >
                Voir le classement FFF
                <ChevronRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-neutral-950">
              Buteurs / passeurs
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Filtrer les statistiques joueurs par catégorie ou par équipe.
            </p>
          </div>

          <select
            value={selectedStatsCategory}
            onChange={(event) => setSelectedStatsCategory(event.target.value)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 outline-none transition focus:border-orange-400"
          >
            {statsCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
              <Goal className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-neutral-950">
                Meilleurs buteurs
              </h2>

              <p className="text-sm text-neutral-500">Top scoreurs du club</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {topScorers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
                    #{index + 1}
                  </div>

                  <div>
                    <div className="font-bold text-neutral-950">
                      {player.firstName} {player.lastName}
                    </div>

                    <div className="text-sm text-neutral-500">
                      {player.team}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-orange-600">
                    {player.goals}
                  </div>

                  <div className="text-xs uppercase tracking-wide text-neutral-400">
                    buts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-600">
              <Trophy className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-neutral-950">
                Meilleurs passeurs
              </h2>

              <p className="text-sm text-neutral-500">Top passeurs du club</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {topAssists.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
                    #{index + 1}
                  </div>

                  <div>
                    <div className="font-bold text-neutral-950">
                      {player.firstName} {player.lastName}
                    </div>

                    <div className="text-sm text-neutral-500">
                      {player.team}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-sky-600">
                    {player.assists}
                  </div>

                  <div className="text-xs uppercase tracking-wide text-neutral-400">
                    passes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
