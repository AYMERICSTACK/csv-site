"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Container from "@/components/Container";

type TeamSchedule = {
  id: string;
  day: string;
  time: string;
};

type Team = {
  id: string;
  category: string;
  coach: string;
  schedules: TeamSchedule[];
};

type TeamGroup = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  teams: Team[];
};

type EquipesClientProps = {
  groups: TeamGroup[];
};

export default function EquipesClient({ groups }: EquipesClientProps) {
  const filters = ["Toutes", ...groups.map((group) => group.title)];
  const [activeFilter, setActiveFilter] = useState("Toutes");

  const visibleGroups = useMemo(() => {
    if (activeFilter === "Toutes") return groups;
    return groups.filter((group) => group.title === activeFilter);
  }, [activeFilter, groups]);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="relative h-[280px] md:h-[360px]">
          <Image
            src="/equipes-banner.jpeg"
            alt="Équipes du CS Viriat"
            fill
            priority
            className="object-cover object-[center_40%]"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-orange-500/15" />

          <Container>
            <div className="relative flex h-full items-end pb-10">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-csv-orange" />
                  Organisation sportive
                </div>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                  Équipes & horaires
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
                  Retrouvez ici les catégories du club, les responsables
                  techniques et les créneaux d’entraînement.
                </p>
              </div>
            </div>
          </Container>
        </div>
      </section>

      <Container>
        <div className="py-14">
          <div className="flex flex-col gap-5 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-extrabold text-neutral-900">
                Filtrer les catégories
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const active = activeFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-csv-black text-white"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                    ].join(" ")}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-12 space-y-10">
            {visibleGroups.map((group) => (
              <section
                key={group.id}
                className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="relative overflow-hidden border-b border-neutral-200 bg-neutral-950 px-6 py-6 md:px-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-neutral-900 to-orange-500/20" />
                  <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-csv-orange/20 blur-3xl" />

                  <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                        {group.badge}
                      </div>

                      <h2 className="mt-3 text-2xl font-extrabold text-white">
                        {group.title}
                      </h2>

                      <p className="mt-2 text-sm leading-relaxed text-white/75">
                        {group.subtitle}
                      </p>
                    </div>

                    <div className="text-xs font-semibold uppercase tracking-wide text-white/50">
                      CS Viriat
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {group.teams.map((team) => (
                      <div
                        key={team.id}
                        className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-extrabold text-neutral-900">
                              {team.category}
                            </div>
                            <div className="mt-1 text-sm text-neutral-600">
                              Responsable :{" "}
                              <span className="font-semibold text-neutral-800">
                                {team.coach}
                              </span>
                            </div>
                          </div>

                          <div className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-bold text-neutral-700">
                            Catégorie
                          </div>
                        </div>

                        <div className="mt-5 space-y-3">
                          {team.schedules.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3"
                            >
                              <span className="text-sm font-semibold text-neutral-700">
                                {slot.day}
                              </span>
                              <span className="text-sm font-extrabold text-neutral-900">
                                {slot.time}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <Link
                            href="/contact"
                            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                          >
                            Contacter le club
                          </Link>

                          <Link
                            href="/inscriptions"
                            className="inline-flex items-center justify-center rounded-xl bg-csv-orange px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                          >
                            Inscriptions
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm leading-relaxed text-neutral-600">
            Les horaires sont donnés à titre indicatif et peuvent être ajustés
            en cours de saison selon les disponibilités des terrains et de
            l’encadrement.
          </div>
        </div>
      </Container>
    </>
  );
}
