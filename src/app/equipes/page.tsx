"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Container from "@/components/Container";

const groups = [
  {
    title: "École de foot",
    subtitle:
      "Découverte, apprentissage et plaisir du jeu pour les plus jeunes.",
    badge: "Formation",
    teams: [
      {
        category: "U7",
        coach: "Meline Duverger",
        schedule: [{ day: "Mercredi", time: "16h00 – 17h00" }],
      },
      {
        category: "U9",
        coach: "Romain Pernod",
        schedule: [{ day: "Mercredi", time: "17h00 – 18h30" }],
      },
      {
        category: "U11",
        coach: "Anthony Bernard",
        schedule: [
          { day: "Mercredi", time: "17h30 - 19h00" },
          { day: "Vendredi", time: "17h30 - 19h00" },
        ],
      },
    ],
  },
  {
    title: "Jeunes compétition",
    subtitle:
      "Progression, exigence et accompagnement sur les catégories jeunes.",
    badge: "Compétition",
    teams: [
      {
        category: "U13",
        coach: "Gregory Martinez",
        schedule: [
          { day: "Mardi", time: "18h00 – 19h30" },
          { day: "Jeudi", time: "18h00 – 19h30" },
        ],
      },
      {
        category: "U15",
        coach: "Josselin Grefferat",
        schedule: [
          { day: "Mardi", time: "18h00 – 19h30" },
          { day: "Jeudi", time: "18h00 – 19h30" },
        ],
      },
      {
        category: "U18",
        coach: "Gerald Rodak",
        schedule: [
          { day: "Mardi", time: "19h30 – 21h00" },
          { day: "Jeudi", time: "19h30 – 21h00" },
        ],
      },
    ],
  },
  {
    title: "Seniors",
    subtitle:
      "Performance, engagement collectif et vie de club au plus haut niveau amateur.",
    badge: "Club",
    teams: [
      {
        category: "Seniors",
        coach: "Louis Costa",
        schedule: [
          { day: "Mercredi", time: "19h30 – 21h00" },
          { day: "Vendredi", time: "19h30 – 21h00" },
        ],
      },
      {
        category: "Seniors F",
        coach: "Vanessa Muffat Jeandet",
        schedule: [{ day: "Horaires", time: "À confirmer" }],
      },
      {
        category: "Vétérans",
        coach: "Cyril Dupuis",
        schedule: [{ day: "Horaires", time: "À confirmer" }],
      },
    ],
  },
];

const filters = ["Toutes", "École de foot", "Jeunes compétition", "Seniors"];

export default function EquipesPage() {
  const [activeFilter, setActiveFilter] = useState("Toutes");

  const visibleGroups = useMemo(() => {
    if (activeFilter === "Toutes") return groups;
    return groups.filter((group) => group.title === activeFilter);
  }, [activeFilter]);

  return (
    <>
      {/* HERO BANDEAU */}
      <section className="relative overflow-hidden">
        <div className="relative h-[280px] md:h-[360px]">
          <Image
            src="/equipes-banner.jpeg"
            alt="Équipes du CS Viriat"
            fill
            priority
            className="object-cover object-[center_40%] transition-transform duration-700 group-hover:scale-105"
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

                <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                  Équipes & horaires
                </h1>

                <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-white/85">
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
          {/* FILTRES + CTA */}
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

          {/* SECTIONS */}
          <div className="mt-12 space-y-10">
            {visibleGroups.map((group) => (
              <section
                key={group.title}
                className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
              >
                {/* Entête premium */}
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

                {/* Cartes */}
                <div className="p-6 md:p-8">
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {group.teams.map((team) => (
                      <div
                        key={team.category}
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
                          {team.schedule.map((slot, index) => (
                            <div
                              key={index}
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

          {/* NOTE */}
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
