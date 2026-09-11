import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Star } from "lucide-react";
import { auth } from "@/auth";
import Container from "@/components/Container";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { CLUB_TEAMS, normalizeTeamName, slugifyTeam } from "@/lib/teams";

function getTeamSection(team: string) {
  if (
    team.startsWith("Seniors") ||
    team === "Féminines" ||
    team === "Vétérans"
  ) {
    return "Seniors";
  }

  if (
    team.startsWith("U20") ||
    team.startsWith("U18") ||
    team.startsWith("U17") ||
    team.startsWith("U15") ||
    team.startsWith("U13")
  ) {
    return "Formation";
  }

  return "École de foot";
}

const sectionDescriptions: Record<string, string> = {
  Seniors: "Équipes seniors, féminines et vétérans.",
  Formation: "Groupes jeunes compétitifs U13 à U20.",
  "École de foot": "U7, U9 et U11 : apprentissage, rassemblements et plateaux.",
};

export default async function AdminEquipesPage() {
  await requireRole(["admin", "educateurs"]);

  const session = await auth();

  async function setFavoriteTeam(formData: FormData) {
    "use server";

    const session = await auth();

    if (!session?.user?.id) {
      return;
    }

    const teamId = String(formData.get("teamId") || "").trim();
    const teamName = String(formData.get("teamName") || "").trim();

    if (!teamId && !teamName) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { favoriteTeamId: null },
      });

      revalidatePath("/admin/equipes");
      return;
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favoriteTeamId: true },
    });

    if (teamId && currentUser?.favoriteTeamId === teamId) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { favoriteTeamId: null },
      });

      revalidatePath("/admin/equipes");
      return;
    }

    let finalTeamId = teamId;

    if (!finalTeamId && teamName) {
      const normalizedTeamName = normalizeTeamName(teamName);

      let team = await prisma.team.findFirst({
        where: {
          category: {
            equals: normalizedTeamName,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (!team) {
        const section = getTeamSection(teamName);

        const groups = await prisma.teamGroup.findMany({
          select: {
            id: true,
            title: true,
          },
        });

        const group =
          groups.find(
            (group) =>
              normalizeTeamName(group.title) === normalizeTeamName(section),
          ) ?? groups[0];

        if (!group) {
          revalidatePath("/admin/equipes");
          return;
        }

        team = await prisma.team.create({
          data: {
            category: teamName,
            coach: "À renseigner",
            groupId: group.id,
          },
          select: { id: true },
        });
      }

      finalTeamId = team.id;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        favoriteTeamId: finalTeamId || null,
      },
    });

    revalidatePath("/admin/equipes");
  }

  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: [{ team: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
  });

  const matches = await prisma.match.findMany({
    orderBy: { matchDate: "desc" },
  });

  const plateaux = await prisma.plateau.findMany({
    orderBy: { eventDate: "desc" },
    select: {
      id: true,
      eventDate: true,
      location: true,
      title: true,
      team: { select: { category: true } },
    },
  });

  const dbTeams = await prisma.team.findMany({
    select: {
      id: true,
      category: true,
    },
  });

  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { favoriteTeamId: true },
      })
    : null;

  const favoriteTeamId = currentUser?.favoriteTeamId ?? null;

  const teamCards = CLUB_TEAMS.map((team) => {
    const normalizedTeam = normalizeTeamName(team);

    const dbTeam = dbTeams.find(
      (dbTeam) => normalizeTeamName(dbTeam.category) === normalizedTeam,
    );

    const teamPlayers = players.filter(
      (player) => normalizeTeamName(player.team || "") === normalizedTeam,
    );

    const teamMatches = matches.filter(
      (match) => normalizeTeamName(match.team || "") === normalizedTeam,
    );

    const teamPlateaux = plateaux.filter(
      (plateau) => normalizeTeamName(plateau.team.category) === normalizedTeam,
    );

    const isSchoolFoot = /^(U7|U9|U11)(?:\s|$)/i.test(team);

    const nextMatch = teamMatches
      .filter((match) => new Date(match.matchDate) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
      )[0];

    const nextPlateau = teamPlateaux
      .filter((plateau) => new Date(plateau.eventDate) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      )[0];

    return {
      id: dbTeam?.id ?? null,
      team,
      slug: slugifyTeam(team),
      section: getTeamSection(team),
      playersCount: teamPlayers.length,
      matchesCount: teamMatches.length,
      plateauxCount: teamPlateaux.length,
      nextMatch,
      nextPlateau,
      isSchoolFoot,
      isFavorite: dbTeam?.id === favoriteTeamId,
    };
  });

  const favoriteTeam = teamCards.find((team) => team.isFavorite) ?? null;

  const groupedTeams = ["Seniors", "Formation", "École de foot"].map(
    (section) => ({
      section,
      description: sectionDescriptions[section],
      teams: teamCards
        .filter((team) => team.section === section)
        .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)),
    }),
  );

  const totalPlayers = teamCards.reduce(
    (sum, team) => sum + team.playersCount,
    0,
  );

  const totalMatches = teamCards.reduce(
    (sum, team) => sum + team.matchesCount,
    0,
  );

  return (
    <Container>
      <div className="pb-24 pt-6 sm:py-14">
        <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.55)]">
          <div className="relative p-5 text-white sm:p-8 md:p-10">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                  Espace éducateurs
                </div>

                <Link
                  href="/espace-educateurs"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  ← Tableau de bord sportif
                </Link>

                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                  Gestion des équipes
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                  Sélectionnez une équipe pour gérer son groupe, ses joueurs et
                  ses matchs. Les équipes sont regroupées pour une lecture plus
                  claire.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center sm:px-4">
                  <div className="text-xl font-black sm:text-2xl">
                    {teamCards.length}
                  </div>
                  <div className="text-[11px] font-bold uppercase text-white/60">
                    Équipes
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center sm:px-4">
                  <div className="text-xl font-black sm:text-2xl">
                    {totalPlayers}
                  </div>
                  <div className="text-[11px] font-bold uppercase text-white/60">
                    Joueurs
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center sm:px-4">
                  <div className="text-xl font-black sm:text-2xl">
                    {totalMatches}
                  </div>
                  <div className="text-[11px] font-bold uppercase text-white/60">
                    Matchs
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {favoriteTeam && (
          <section className="mt-6 rounded-[1.75rem] border border-orange-200 bg-orange-50 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-orange-700">
                  ⭐ Mon équipe favorite
                </div>

                <h2 className="mt-3 text-2xl font-black text-neutral-950">
                  {favoriteTeam.team}
                </h2>

                <p className="mt-1 text-sm font-semibold text-neutral-600">
                  {favoriteTeam.playersCount} joueur(s) ·{" "}
                  {favoriteTeam.isSchoolFoot
                    ? `${favoriteTeam.plateauxCount} plateau${favoriteTeam.plateauxCount > 1 ? "x" : ""}`
                    : `${favoriteTeam.matchesCount} match(s)`}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Link
                  href="/espace-educateurs"
                  className="inline-flex items-center justify-center rounded-xl bg-csv-orange px-4 py-3 text-sm font-black text-white transition hover:opacity-90"
                >
                  Tableau de bord sportif
                </Link>

                {favoriteTeam.isSchoolFoot ? (
                  <Link
                    href={`/admin/plateaux/new?team=${encodeURIComponent(favoriteTeam.team)}`}
                    className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-100"
                  >
                    Ajouter un plateau
                  </Link>
                ) : null}

                {favoriteTeam.id ? (
                  <Link
                    href={`/espace-educateurs/equipes/${favoriteTeam.id}/edit`}
                    className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm font-black text-orange-700 transition hover:bg-orange-100"
                  >
                    Infos & responsable
                  </Link>
                ) : null}

                <Link
                  href={`/admin/equipes/${favoriteTeam.slug}`}
                  className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-3 text-sm font-black text-white transition hover:opacity-90"
                >
                  Gérer l’équipe
                </Link>
              </div>
            </div>
          </section>
        )}

        <div className="sticky top-0 z-20 -mx-4 mt-6 border-y border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {groupedTeams.map((group) => (
              <a
                key={group.section}
                href={`#${group.section.toLowerCase().replace(/\s+/g, "-")}`}
                className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-neutral-700"
              >
                {group.section}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
          {groupedTeams.map((group) => (
            <section
              key={group.section}
              id={group.section.toLowerCase().replace(/\s+/g, "-")}
              className="scroll-mt-24"
            >
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                    Pôle
                  </div>

                  <h2 className="mt-1 text-2xl font-black text-neutral-950">
                    {group.section}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    {group.description}
                  </p>
                </div>

                <div className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-700">
                  {group.teams.length} équipe(s)
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.teams.map((item) => {
                  const hasPlayers = item.playersCount > 0;
                  const hasMatches = item.matchesCount > 0;

                  return (
                    <article
                      id={`team-${item.slug}`}
                      key={item.team}
                      className={`group scroll-mt-28 rounded-[1.5rem] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-[1.75rem] sm:p-5 ${
                        item.isFavorite
                          ? "border-orange-300 ring-2 ring-orange-100"
                          : "border-neutral-200 hover:border-orange-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
                            Équipe
                          </div>

                          <h3 className="mt-1 text-2xl font-black text-neutral-950">
                            {item.team}
                          </h3>

                          {item.isFavorite && (
                            <div className="mt-2 inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-orange-700">
                              ⭐ Équipe favorite
                            </div>
                          )}
                        </div>

                        <form action={setFavoriteTeam}>
                          <input
                            type="hidden"
                            name="teamId"
                            value={item.id ?? ""}
                          />

                          <input
                            type="hidden"
                            name="teamName"
                            value={item.team}
                          />

                          <button
                            type="submit"
                            title={
                              item.isFavorite
                                ? "Retirer des favoris"
                                : "Définir comme favori"
                            }
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                              item.isFavorite
                                ? "bg-orange-500 text-white"
                                : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                            }`}
                          >
                            <Star
                              className="h-5 w-5"
                              fill={item.isFavorite ? "currentColor" : "none"}
                            />
                          </button>
                        </form>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            hasPlayers
                              ? "bg-orange-50 text-orange-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {item.playersCount} joueur(s)
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            item.isSchoolFoot
                              ? item.plateauxCount > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-neutral-100 text-neutral-500"
                              : hasMatches
                                ? "bg-neutral-950 text-white"
                                : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {item.isSchoolFoot
                            ? `${item.plateauxCount} plateau${item.plateauxCount > 1 ? "x" : ""}`
                            : `${item.matchesCount} match(s)`}
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl bg-neutral-50 p-3 sm:mt-5 sm:p-4">
                        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">
                          {item.isSchoolFoot ? "Prochain plateau" : "Prochain match"}
                        </div>

                        <div className="mt-1 text-sm font-bold text-neutral-800">
                          {item.isSchoolFoot
                            ? item.nextPlateau
                              ? `${item.nextPlateau.title || "Plateau"} — ${new Date(
                                  item.nextPlateau.eventDate,
                                ).toLocaleDateString("fr-FR")}`
                              : "Aucun plateau à venir"
                            : item.nextMatch
                              ? `${item.nextMatch.opponent} — ${new Date(
                                  item.nextMatch.matchDate,
                                ).toLocaleDateString("fr-FR")}`
                              : "Aucun match à venir"}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap">
                        {item.isSchoolFoot ? (
                          <Link
                            href={`/admin/plateaux/new?team=${encodeURIComponent(item.team)}`}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-csv-orange px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto sm:py-2"
                          >
                            Ajouter un plateau
                          </Link>
                        ) : null}

                        <Link
                          href={`/admin/equipes/${item.slug}`}
                          className="inline-flex w-full items-center justify-center rounded-xl bg-csv-black px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto sm:py-2"
                        >
                          Gérer l’équipe
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
