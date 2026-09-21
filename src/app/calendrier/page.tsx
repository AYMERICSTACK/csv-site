import Container from "@/components/Container";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/prisma";
import CalendarMatchesClient from "@/components/CalendarMatchesClient";
import { parseParisDateTime } from "@/lib/paris-datetime";
import { formatPlayerName } from "@/lib/person-select";

function getDefaultCalendarView() {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Europe/Paris",
  }).format(new Date());

  return ["Thu", "Fri", "Sat", "Sun"].includes(weekday)
    ? ("upcoming" as const)
    : ("all" as const);
}

function getRecentResultsRange() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  const today = new Date(Date.UTC(values.year, values.month - 1, values.day));
  const dayOfWeek = today.getUTCDay();

  // Vendredi à dimanche : résultats du week-end en cours.
  // Lundi à jeudi : résultats du week-end qui vient de se terminer.
  const daysFromFriday =
    dayOfWeek === 5
      ? 0
      : dayOfWeek === 6
        ? -1
        : dayOfWeek === 0
          ? -2
          : -(dayOfWeek + 2);

  const friday = new Date(today);
  friday.setUTCDate(today.getUTCDate() + daysFromFriday);

  const monday = new Date(friday);
  monday.setUTCDate(friday.getUTCDate() + 3);

  const formatDate = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
      date.getUTCDate(),
    ).padStart(2, "0")}`;

  return {
    start: parseParisDateTime(`${formatDate(friday)}T00:00`),
    end: parseParisDateTime(`${formatDate(monday)}T00:00`),
  };
}

export default async function CalendrierPage() {
  const recentRange = getRecentResultsRange();
  const now = new Date();
  const upcomingLimit = new Date(now);
  upcomingLimit.setDate(upcomingLimit.getDate() + 30);

  const [recentResults, upcomingMatches, upcomingPlateaux] = await Promise.all([
    prisma.match.findMany({
      where: {
        status: "finished",
        matchDate: {
          gte: recentRange.start,
          lt: recentRange.end,
        },
      },
      orderBy: {
        matchDate: "desc",
      },
      include: {
        manOfMatch: {
          select: { firstName: true, lastName: true, photoUrl: true, photoConsent: true },
        },
      },
    }),
    prisma.match.findMany({
      where: {
        status: {
          not: "finished",
        },
        matchDate: {
          gte: now,
          lte: upcomingLimit,
        },
      },
      orderBy: {
        matchDate: "asc",
      },
      include: {
        manOfMatch: {
          select: { firstName: true, lastName: true, photoUrl: true, photoConsent: true },
        },
      },
    }),
    prisma.plateau.findMany({
      where: {
        status: { notIn: ["finished", "cancelled"] },
        eventDate: { gte: now, lte: upcomingLimit },
      },
      orderBy: { eventDate: "asc" },
      include: {
        team: { select: { category: true } },
        participants: { orderBy: { sortOrder: "asc" } },
        games: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  const serializeMatch = (match: (typeof recentResults)[number] | (typeof upcomingMatches)[number]) => ({
    ...match,
    matchDate: match.matchDate.toISOString(),
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
    manOfMatch: match.manOfMatch
      ? {
          name: formatPlayerName(match.manOfMatch.firstName, match.manOfMatch.lastName),
          photoUrl: match.manOfMatch.photoConsent && match.manOfMatch.photoUrl ? match.manOfMatch.photoUrl : null,
        }
      : null,
  });

  const recentResultsSerialized = recentResults.map(serializeMatch);
  const upcomingMatchesSerialized = upcomingMatches.map(serializeMatch);

  const upcomingPlateauxSerialized = upcomingPlateaux.map((plateau) => ({
    id: plateau.id,
    team: plateau.team.category,
    eventDate: plateau.eventDate.toISOString(),
    location: plateau.location,
    format: plateau.format,
    status: plateau.status,
    title: plateau.title,
    participants: plateau.participants.map((item) => item.name),
    games: plateau.games.map((game) => ({
      id: game.id,
      opponent: game.opponent,
      scoreTeam: game.scoreTeam,
      scoreOpponent: game.scoreOpponent,
    })),
  }));

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 px-6 py-8 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.55)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.24),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.12),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Calendrier</Badge>
              <Badge>Matchs</Badge>
              <Badge>Résultats</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Calendrier du club
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
              Retrouvez les résultats récents et les prochains matchs du CS
              Viriat avec une lecture plus dynamique, plus contrastée et plus
              premium.
            </p>
          </div>
        </section>

        <CalendarMatchesClient
          recentResults={recentResultsSerialized}
          upcomingMatches={upcomingMatchesSerialized}
          upcomingPlateaux={upcomingPlateauxSerialized}
          initialView={getDefaultCalendarView()}
        />
      </div>
    </Container>
  );
}
