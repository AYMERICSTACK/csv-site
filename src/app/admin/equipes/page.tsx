import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { CLUB_TEAMS, normalizeTeamName, slugifyTeam } from "@/lib/teams";

function canManageTeams(role?: string | null) {
  return role === "admin" || role === "educateurs";
}

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
    team.startsWith("U15")
  ) {
    return "Formation";
  }

  return "École de foot";
}

const sectionDescriptions: Record<string, string> = {
  Seniors: "Équipes seniors, féminines et vétérans.",
  Formation: "Groupes jeunes compétitifs et transition vers les seniors.",
  "École de foot": "Catégories jeunes et apprentissage.",
};

export default async function AdminEquipesPage() {
  const session = await auth();

  if (!session) redirect("/admin/login");
  if (!canManageTeams(session.user?.role)) redirect("/espace-club");

  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: [{ team: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
  });

  const matches = await prisma.match.findMany({
    orderBy: { matchDate: "desc" },
  });

  const teamCards = CLUB_TEAMS.map((team) => {
    const teamPlayers = players.filter(
      (player) => normalizeTeamName(player.team || "") === team,
    );

    const teamMatches = matches.filter(
      (match) => normalizeTeamName(match.team || "") === team,
    );

    const nextMatch = teamMatches
      .filter((match) => new Date(match.matchDate) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
      )[0];

    return {
      team,
      slug: slugifyTeam(team),
      section: getTeamSection(team),
      playersCount: teamPlayers.length,
      matchesCount: teamMatches.length,
      nextMatch,
    };
  });

  const groupedTeams = ["Seniors", "Formation", "École de foot"].map(
    (section) => ({
      section,
      description: sectionDescriptions[section],
      teams: teamCards.filter((team) => team.section === section),
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
      <div className="py-14">
        <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.55)]">
          <div className="relative p-8 text-white md:p-10">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                  Espace éducateurs
                </div>

                <Link
                  href="/espace-club"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  ← Retour espace club
                </Link>

                <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                  Gestion des équipes
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                  Sélectionnez une équipe pour gérer son groupe, ses joueurs et
                  ses matchs. Les équipes sont regroupées pour une lecture plus
                  claire.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">
                  <div className="text-2xl font-black">{teamCards.length}</div>
                  <div className="text-[11px] font-bold uppercase text-white/60">
                    Équipes
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">
                  <div className="text-2xl font-black">{totalPlayers}</div>
                  <div className="text-[11px] font-bold uppercase text-white/60">
                    Joueurs
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">
                  <div className="text-2xl font-black">{totalMatches}</div>
                  <div className="text-[11px] font-bold uppercase text-white/60">
                    Matchs
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 space-y-10">
          {groupedTeams.map((group) => (
            <section key={group.section}>
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

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.teams.map((item) => {
                  const hasPlayers = item.playersCount > 0;
                  const hasMatches = item.matchesCount > 0;

                  return (
                    <Link
                      key={item.team}
                      href={`/admin/equipes/${item.slug}`}
                      className="group rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
                            Équipe
                          </div>

                          <h3 className="mt-1 text-2xl font-black text-neutral-950">
                            {item.team}
                          </h3>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-lg">
                          ⚽
                        </div>
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
                            hasMatches
                              ? "bg-neutral-950 text-white"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {item.matchesCount} match(s)
                        </span>
                      </div>

                      <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
                        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">
                          Prochain match
                        </div>

                        <div className="mt-1 text-sm font-bold text-neutral-800">
                          {item.nextMatch
                            ? `${item.nextMatch.opponent} — ${new Date(
                                item.nextMatch.matchDate,
                              ).toLocaleDateString("fr-FR")}`
                            : "Aucun match à venir"}
                        </div>
                      </div>

                      <div className="mt-5 inline-flex items-center rounded-xl bg-csv-black px-4 py-2 text-sm font-bold text-white transition group-hover:opacity-90">
                        Gérer l’équipe
                      </div>
                    </Link>
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
