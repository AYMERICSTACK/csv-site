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
  const day = now.getDay(); // 0=dimanche, 1=lundi, ..., 4=jeudi, 5=vendredi, 6=samedi

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
  if (day === 4) diffToFriday = 1; // jeudi -> vendredi
  if (day === 5) diffToFriday = 0; // vendredi
  if (day === 6) diffToFriday = -1; // samedi

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
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Calendrier</Badge>
            <Badge>Matchs</Badge>
            <Badge>Résultats</Badge>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
            Calendrier du club
          </h1>

          <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
            Retrouvez les résultats récents et les prochains matchs du CS Viriat
            avec un affichage plus clair par catégorie.
          </p>
        </div>

        <CalendarMatchesClient
          recentResults={recentResultsSerialized}
          upcomingMatches={upcomingMatchesSerialized}
        />
      </div>
    </Container>
  );
}
