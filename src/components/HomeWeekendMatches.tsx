import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import HomeWeekendMatchesClient from "@/components/HomeWeekendMatchesClient";
import { prisma } from "@/lib/prisma";

type WeekendWindow = { start: Date; end: Date };

function getHomeWeekendWindow(): WeekendWindow {
  const now = new Date();
  const day = now.getDay();
  const friday = new Date(now);

  const offsetToFriday: Record<number, number> = {
    0: -2,
    1: -3,
    2: -4,
    3: -5,
    4: 1,
    5: 0,
    6: -1,
  };

  friday.setDate(now.getDate() + offsetToFriday[day]);
  friday.setHours(0, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  return { start: friday, end: sunday };
}

function getWeekendContent() {
  const day = new Date().getDay();

  if ([4, 5, 6, 0].includes(day)) {
    return {
      title: "Matchs du week-end",
      subtitle: "Tout le programme du CS Viriat, filtrable par catégorie.",
    };
  }

  return {
    title: "Retour sur le week-end",
    subtitle: "Retrouvez les matchs et résultats du dernier week-end du CS Viriat.",
  };
}

export default async function HomeWeekendMatches() {
  const range = getHomeWeekendWindow();
  const [matches, plateaux] = await Promise.all([
    prisma.match.findMany({
    where: {
      matchDate: {
        gte: range.start,
        lte: range.end,
      },
    },
    orderBy: { matchDate: "asc" },
    select: {
      id: true,
      category: true,
      team: true,
      opponent: true,
      matchDate: true,
      location: true,
      isHome: true,
      status: true,
      scoreTeam: true,
      scoreOpponent: true,
      scorers: true,
      competitionKey: true,
      competitionLabel: true,
      competitionType: true,
      roundLabel: true,
    },
    }),
    prisma.plateau.findMany({
      where: {
        eventDate: { gte: range.start, lte: range.end },
        status: { not: "cancelled" },
      },
      orderBy: { eventDate: "asc" },
      include: {
        team: { select: { category: true } },
        participants: { orderBy: { sortOrder: "asc" } },
        games: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  if (matches.length === 0 && plateaux.length === 0) return null;

  const serialized = matches.map((match) => ({
    ...match,
    matchDate: match.matchDate.toISOString(),
  }));

  const serializedPlateaux = plateaux.map((plateau) => ({
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

  const content = getWeekendContent();

  return (
    <section className="py-16">
      <Container>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Week-end</Badge>
          <Badge>Matchs & résultats</Badge>
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">{content.title}</h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">{content.subtitle}</p>
          </div>

          <Link
            href="/calendrier"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
          >
            Voir tout le calendrier
          </Link>
        </div>

        <HomeWeekendMatchesClient matches={serialized} plateaux={serializedPlateaux} />
      </Container>
    </section>
  );
}
