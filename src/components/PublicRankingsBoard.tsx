"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Goal, Trophy } from "lucide-react";

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

export default function PublicRankingsBoard({
  season,
  players,
  fffClubUrl,
  officialTeamRankings,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState("Toutes");

  const categories = useMemo(() => {
    const values = new Set<string>();

    players.forEach((player) => {
      if (player.category) {
        values.add(player.category);
      }
    });

    return ["Toutes", ...Array.from(values)];
  }, [players]);

  const filteredPlayers =
    selectedCategory === "Toutes"
      ? players
      : players.filter((player) => player.category === selectedCategory);

  const topScorers = [...filteredPlayers]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);

  const topAssists = [...filteredPlayers]
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 10);

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
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 outline-none transition focus:border-orange-400"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {officialTeamRankings.map((team) => (
            <a
              key={team.label}
              href={team.url || fffClubUrl}
              target="_blank"
              rel="noreferrer"
              className="group rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:bg-white hover:shadow-xl"
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

                <div className="rounded-2xl bg-neutral-950 p-3 text-white transition group-hover:bg-orange-500">
                  <ExternalLink className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 text-sm font-semibold text-orange-600">
                Voir le classement FFF
              </div>
            </a>
          ))}
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
