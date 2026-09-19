import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import HomeWeekendMatchesClient from "@/components/HomeWeekendMatchesClient";
import { prisma } from "@/lib/prisma";
import { parseParisDateTime } from "@/lib/paris-datetime";

type WeekendWindow = { start: Date; end: Date };

function getParisCalendarDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function addCalendarDays(year: number, month: number, day: number, amount: number) {
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function localDateTime(parts: { year: number; month: number; day: number }, time: string) {
  return parseParisDateTime(`${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${time}`);
}

function getHomeWeekendWindow(): WeekendWindow {
  const parisToday = getParisCalendarDate();
  const weekday = new Date(Date.UTC(parisToday.year, parisToday.month - 1, parisToday.day)).getUTCDay();

  const offsetToFriday: Record<number, number> = {
    0: -2,
    1: -3,
    2: -4,
    3: -5,
    4: 1,
    5: 0,
    6: -1,
  };

  const friday = addCalendarDays(parisToday.year, parisToday.month, parisToday.day, offsetToFriday[weekday]);
  const monday = addCalendarDays(friday.year, friday.month, friday.day, 3);
  const start = localDateTime(friday, "00:00");
  const end = new Date(localDateTime(monday, "00:00").getTime() - 1);
  return { start, end };
}

function getWeekendContent() {
  const parisToday = getParisCalendarDate();
  const day = new Date(Date.UTC(parisToday.year, parisToday.month - 1, parisToday.day)).getUTCDay();

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
      penaltyScoreTeam: true,
      penaltyScoreOpponent: true,
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
