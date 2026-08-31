import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugifyTeam } from "@/lib/teams";
import {
  CURRENT_FOOTBALL_SEASON,
  getFootballSeasonDateRange,
} from "@/lib/football-season";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleDot,
  Goal,
  MapPin,
  Medal,
  Plus,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";

function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

function formatMatchTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date);
}

function getPlayerName(player: { firstName: string; lastName: string }) {
  return `${player.firstName} ${player.lastName}`.trim();
}

export default async function EspaceEducateursPage() {
  const { user } = await requireRole(["admin", "educateurs"]);
  const session = await auth();
  const { start, end } = getFootballSeasonDateRange();
  const now = new Date();

  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          favoriteTeam: {
            select: {
              id: true,
              category: true,
              coach: true,
            },
          },
        },
      })
    : null;

  const favoriteTeam = currentUser?.favoriteTeam ?? null;

  const [seasonMatches, leaders] = favoriteTeam
    ? await Promise.all([
        prisma.match.findMany({
          where: {
            team: favoriteTeam.category,
            matchDate: { gte: start, lt: end },
          },
          orderBy: { matchDate: "asc" },
        }),
        prisma.playerStat.findMany({
          where: {
            season: CURRENT_FOOTBALL_SEASON,
            player: {
              isActive: true,
              team: favoriteTeam.category,
            },
          },
          include: {
            player: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: [{ goals: "desc" }, { assists: "desc" }],
        }),
      ])
    : [[], []];

  const finishedMatches = seasonMatches.filter(
    (match) =>
      match.status === "finished" &&
      match.scoreTeam !== null &&
      match.scoreOpponent !== null,
  );

  const nextMatch =
    seasonMatches.find(
      (match) =>
        match.matchDate >= now &&
        match.status !== "finished" &&
        match.status !== "cancelled",
    ) ?? null;

  const lastMatch = [...finishedMatches]
    .sort((a, b) => b.matchDate.getTime() - a.matchDate.getTime())[0] ?? null;

  const record = finishedMatches.reduce(
    (acc, match) => {
      const teamScore = match.scoreTeam ?? 0;
      const opponentScore = match.scoreOpponent ?? 0;

      acc.goalsFor += teamScore;
      acc.goalsAgainst += opponentScore;

      if (teamScore > opponentScore) acc.wins += 1;
      else if (teamScore === opponentScore) acc.draws += 1;
      else acc.losses += 1;

      return acc;
    },
    { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
  );

  const topScorer = [...leaders]
    .filter((stat) => stat.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)[0] ?? null;

  const topAssist = [...leaders]
    .filter((stat) => stat.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)[0] ?? null;

  const role = user.role;
  const dashboardHref = role === "admin" ? "/admin" : "/espace-club";
  const dashboardLabel =
    role === "admin" ? "Retour dashboard admin" : "Retour espace club";

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 px-6 py-8 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.55)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.10),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={dashboardHref}><Badge>Espace privé</Badge></Link>
                <Badge>Éducateurs</Badge>
                <Badge>Saison {CURRENT_FOOTBALL_SEASON}</Badge>
              </div>

              <div className="mt-4">
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={14} />
                  {dashboardLabel}
                </Link>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Tableau de bord sportif
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Ton équipe, ses prochains rendez-vous et les chiffres clés de la saison au même endroit.
              </p>
            </div>

            <AdminLogoutButton />
          </div>
        </section>

        {favoriteTeam ? (
          <>
            <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-orange-200 bg-orange-50 shadow-sm">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-orange-700">
                    <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                    Mon équipe
                  </div>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950">
                    {favoriteTeam.category}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-neutral-600">
                    Coach : {favoriteTeam.coach || "À renseigner"}
                  </p>
                  <Link
                    href="/admin/equipes"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-black text-orange-700 transition hover:text-orange-600"
                  >
                    <Star className="h-4 w-4" /> Changer mon équipe favorite
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/admin/matchs/new"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-400"
                  >
                    <Plus size={17} /> Ajouter un match
                  </Link>
                  <Link
                    href={`/admin/equipes/${slugifyTeam(favoriteTeam.category)}`}
                    className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Gérer l’équipe
                  </Link>
                </div>
              </div>
            </section>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Matchs joués</span>
                  <Trophy size={18} className="text-csv-orange" />
                </div>
                <div className="mt-3 text-4xl font-black text-neutral-950">{finishedMatches.length}</div>
                <div className="mt-3 flex gap-2 text-xs font-black">
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">{record.wins} V</span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600">{record.draws} N</span>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">{record.losses} D</span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Buts</span>
                  <Goal size={18} className="text-csv-orange" />
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-black text-neutral-950">{record.goalsFor}</span>
                  <span className="pb-1 text-sm font-bold text-neutral-400">marqués</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-neutral-500">
                  {record.goalsAgainst} encaissé{record.goalsAgainst > 1 ? "s" : ""} · diff. {record.goalsFor - record.goalsAgainst > 0 ? "+" : ""}{record.goalsFor - record.goalsAgainst}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Meilleur buteur</span>
                  <Target size={18} className="text-csv-orange" />
                </div>
                {topScorer ? (
                  <>
                    <div className="mt-3 truncate text-xl font-black text-neutral-950">{getPlayerName(topScorer.player)}</div>
                    <p className="mt-2 text-sm font-bold text-neutral-500">{topScorer.goals} but{topScorer.goals > 1 ? "s" : ""}</p>
                  </>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-neutral-400">Aucun but enregistré</p>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Meilleur passeur</span>
                  <Medal size={18} className="text-csv-orange" />
                </div>
                {topAssist ? (
                  <>
                    <div className="mt-3 truncate text-xl font-black text-neutral-950">{getPlayerName(topAssist.player)}</div>
                    <p className="mt-2 text-sm font-bold text-neutral-500">{topAssist.assists} passe{topAssist.assists > 1 ? "s" : ""}</p>
                  </>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-neutral-400">Aucune passe enregistrée</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">Prochain rendez-vous</div>
                    <h2 className="mt-1 text-xl font-black text-neutral-950">Prochain match</h2>
                  </div>
                  <CalendarDays size={22} className="text-csv-orange" />
                </div>

                {nextMatch ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-950 p-5 text-white">
                      <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                          {formatMatchDate(nextMatch.matchDate)} · {formatMatchTime(nextMatch.matchDate)}
                        </div>
                        <div className="mt-2 truncate text-2xl font-black">
                          {nextMatch.isHome ? `${favoriteTeam.category} — ${nextMatch.opponent}` : `${nextMatch.opponent} — ${favoriteTeam.category}`}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-sm text-white/65">
                          <MapPin size={15} /> {nextMatch.location || "Lieu à préciser"}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/admin/matchs/${nextMatch.id}/edit`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-black text-orange-600 hover:text-orange-500"
                    >
                      Ouvrir la fiche du match <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                    <CalendarDays className="mx-auto text-neutral-300" />
                    <p className="mt-3 text-sm font-bold text-neutral-500">Aucun prochain match programmé.</p>
                    <Link href="/admin/matchs/new" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-orange-600">
                      <Plus size={15} /> Ajouter un match
                    </Link>
                  </div>
                )}
              </section>

              <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Dernière rencontre</div>
                    <h2 className="mt-1 text-xl font-black text-neutral-950">Dernier résultat</h2>
                  </div>
                  <CircleDot size={22} className="text-csv-orange" />
                </div>

                {lastMatch ? (
                  <div className="mt-5">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        {formatMatchDate(lastMatch.matchDate)}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <div className="min-w-0 text-lg font-black text-neutral-900">
                          {lastMatch.isHome ? `${favoriteTeam.category} — ${lastMatch.opponent}` : `${lastMatch.opponent} — ${favoriteTeam.category}`}
                        </div>
                        <div className="shrink-0 rounded-xl bg-neutral-950 px-4 py-2 text-2xl font-black text-white">
                          {lastMatch.isHome
                            ? `${lastMatch.scoreTeam}–${lastMatch.scoreOpponent}`
                            : `${lastMatch.scoreOpponent}–${lastMatch.scoreTeam}`}
                        </div>
                      </div>
                      <div className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black bg-white text-neutral-700">
                        {lastMatch.scoreTeam! > lastMatch.scoreOpponent! ? "Victoire" : lastMatch.scoreTeam === lastMatch.scoreOpponent ? "Match nul" : "Défaite"}
                      </div>
                    </div>
                    <Link
                      href={`/admin/matchs/${lastMatch.id}/edit`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-black text-orange-600 hover:text-orange-500"
                    >
                      Voir le détail <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                    <Trophy className="mx-auto text-neutral-300" />
                    <p className="mt-3 text-sm font-bold text-neutral-500">Aucun résultat enregistré cette saison.</p>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <section className="mt-6 rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-black text-neutral-950">Choisis ton équipe favorite</div>
                <p className="mt-1 text-sm text-neutral-500">
                  Le dashboard sportif utilisera cette équipe pour afficher tes matchs et tes statistiques.
                </p>
              </div>
              <Link
                href="/admin/equipes"
                className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                Choisir mon équipe
              </Link>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[1.75rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Raccourcis sportifs</h2>
              <p className="mt-2 text-sm text-white/65">Les actions utiles au quotidien, accessibles directement.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:min-w-[620px]">
              <Link href="/admin/matchs" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                <span>Gestion des matchs</span><CalendarDays size={16} className="text-orange-400" />
              </Link>
              <Link href="/espace-educateurs/equipes" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                <span>Gestion des équipes</span><Users size={16} className="text-orange-400" />
              </Link>
              <Link href="/espace-club/profil" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                <span>Mon profil</span><ShieldCheck size={16} className="text-orange-400" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Container>
  );
}
