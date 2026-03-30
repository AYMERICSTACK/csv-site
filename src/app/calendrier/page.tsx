import Container from "@/components/Container";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/prisma";
import CalendarMatchesClient from "@/components/CalendarMatchesClient";

function getRecentResultsRange() {
  const now = new Date();

  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getUpcomingWeekendRange() {
  const now = new Date();
  const day = now.getDay();

  if (![4, 5, 6, 0].includes(day)) {
    return null;
  }

  if (day === 0) {
    const sundayStart = new Date(now);
    sundayStart.setHours(0, 0, 0, 0);

    const sundayEnd = new Date(now);
    sundayEnd.setHours(23, 59, 59, 999);

    return {
      start: sundayStart,
      end: sundayEnd,
    };
  }

  const friday = new Date(now);
  friday.setHours(18, 0, 0, 0);

  let diffToFriday = 0;
  if (day === 4) diffToFriday = 1;
  if (day === 5) diffToFriday = 0;
  if (day === 6) diffToFriday = -1;

  friday.setDate(now.getDate() + diffToFriday);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: friday,
    end: sunday,
  };
}

export default async function CalendrierPage() {
  const recentRange = getRecentResultsRange();
  const upcomingRange = getUpcomingWeekendRange();

  const [recentResults, upcomingMatches] = await Promise.all([
    prisma.match.findMany({
      where: {
        status: "finished",
        matchDate: {
          gte: recentRange.start,
          lte: recentRange.end,
        },
      },
      orderBy: {
        matchDate: "desc",
      },
    }),
    upcomingRange
      ? prisma.match.findMany({
          where: {
            status: {
              not: "finished",
            },
            matchDate: {
              gte: upcomingRange.start,
              lte: upcomingRange.end,
            },
          },
          orderBy: {
            matchDate: "asc",
          },
        })
      : Promise.resolve([]),
  ]);

  const recentResultsSerialized = recentResults.map((match) => ({
    ...match,
    matchDate: match.matchDate.toISOString(),
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
  }));

  const upcomingMatchesSerialized = upcomingMatches.map((match) => ({
    ...match,
    matchDate: match.matchDate.toISOString(),
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
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
        />
      </div>
    </Container>
  );
}
