import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Trophy } from "lucide-react";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/prisma";

type WeekendWindow = {
  start: Date;
  end: Date;
};

type HomeMatch = {
  id: string;
  category: string;
  team: string;
  opponent: string;
  matchDate: Date;
  location: string;
  isHome: boolean;
  status: string;
  scoreTeam: number | null;
  scoreOpponent: number | null;
  scorers: string | null;
};

function getHomeWeekendWindow(): WeekendWindow {
  const now = new Date();
  const day = now.getDay();

  let fridayStart: Date;

  if ([1, 2, 3].includes(day)) {
    fridayStart = new Date(now);
    fridayStart.setDate(now.getDate() - (day + 2));
  } else if (day === 0) {
    fridayStart = new Date(now);
    fridayStart.setDate(now.getDate() - 2);
  } else if (day === 4) {
    fridayStart = new Date(now);
    fridayStart.setDate(now.getDate() + 1);
  } else if (day === 5) {
    fridayStart = new Date(now);
  } else {
    fridayStart = new Date(now);
    fridayStart.setDate(now.getDate() - 1);
  }

  fridayStart.setHours(0, 0, 0, 0);

  const end = new Date(fridayStart);
  end.setDate(fridayStart.getDate() + 5);
  end.setHours(23, 59, 59, 999);

  return {
    start: fridayStart,
    end,
  };
}

function getWeekendContent() {
  const now = new Date();
  const day = now.getDay();

  if ([4, 5].includes(day)) {
    return {
      title: "Matchs du week-end",
      subtitle: "Retrouvez les rencontres à venir du CS Viriat.",
    };
  }

  if ([6, 0].includes(day)) {
    return {
      title: "Matchs en cours",
      subtitle: "Suivez les rencontres du week-end du CS Viriat.",
    };
  }

  return {
    title: "Résultats du week-end",
    subtitle: "Retrouvez les résultats du week-end du CS Viriat.",
  };
}

async function getHomeWeekendMatches() {
  const range = getHomeWeekendWindow();

  return prisma.match.findMany({
    where: {
      matchDate: {
        gte: range.start,
        lte: range.end,
      },
    },
    orderBy: {
      matchDate: "asc",
    },
    take: 6,
  });
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function hasScore(match: {
  scoreTeam: number | null;
  scoreOpponent: number | null;
}) {
  return match.scoreTeam !== null && match.scoreOpponent !== null;
}

function formatStatus(status: string) {
  switch (status) {
    case "scheduled":
      return "Programmé";
    case "postponed":
      return "Reporté";
    case "cancelled":
      return "Annulé";
    case "finished":
      return "Terminé";
    default:
      return status;
  }
}

function getResultLabel(scoreTeam: number, scoreOpponent: number) {
  if (scoreTeam > scoreOpponent) return "Victoire";
  if (scoreTeam < scoreOpponent) return "Défaite";
  return "Nul";
}

function getResultBadgeClasses(scoreTeam: number, scoreOpponent: number) {
  if (scoreTeam > scoreOpponent) {
    return "border border-green-300 bg-green-100 text-green-800";
  }

  if (scoreTeam < scoreOpponent) {
    return "border border-red-300 bg-red-100 text-red-800";
  }

  return "border border-orange-300 bg-orange-100 text-orange-800";
}

function getUpcomingStatusClasses(status: string) {
  switch (status) {
    case "scheduled":
      return "border border-blue-300 bg-blue-100 text-blue-800";
    case "postponed":
      return "border border-orange-300 bg-orange-100 text-orange-800";
    case "cancelled":
      return "border border-red-300 bg-red-100 text-red-800";
    default:
      return "border border-neutral-300 bg-neutral-100 text-neutral-700";
  }
}

function getVenueBadge(match: HomeMatch) {
  if (match.isHome) {
    return {
      label: "Domicile",
      className:
        "border border-orange-500 bg-orange-500 text-white shadow-[0_10px_25px_-10px_rgba(255,122,0,0.9)]",
    };
  }

  return {
    label: "Extérieur",
    className: "border border-orange-300 bg-white text-orange-600",
  };
}

function formatRepeatedPlayers(value: string) {
  const names = value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const counts = new Map<string, number>();

  for (const name of names) {
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => (count > 1 ? `${name} x${count}` : name))
    .join(", ");
}

function ResultCard({ match }: { match: HomeMatch }) {
  if (match.scoreTeam === null || match.scoreOpponent === null) {
    return null;
  }

  const venueBadge = getVenueBadge(match);
  const leftTeam = match.isHome ? match.team : match.opponent;
  const rightTeam = match.isHome ? match.opponent : match.team;
  const leftScore = match.isHome ? match.scoreTeam : match.scoreOpponent;
  const rightScore = match.isHome ? match.scoreOpponent : match.scoreTeam;
  const leftLabel = match.isHome ? "CSV" : "ADV";
  const rightLabel = match.isHome ? "ADV" : "CSV";

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-neutral-800 bg-neutral-950 p-4 text-white shadow-[0_18px_45px_-28px_rgba(0,0,0,0.72)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-500/60 hover:shadow-[0_24px_55px_-28px_rgba(255,122,0,0.24)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-orange-500/10 blur-2xl transition duration-300 group-hover:bg-orange-500/20" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300">
                {match.category}
              </div>

              <div
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${venueBadge.className}`}
              >
                {venueBadge.label}
              </div>
            </div>

            <h3 className="mt-2 text-base font-extrabold leading-tight text-white sm:text-lg">
              {leftTeam} <span className="text-white/30">vs</span> {rightTeam}
            </h3>
          </div>

          <div
            className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getResultBadgeClasses(
              match.scoreTeam,
              match.scoreOpponent,
            )}`}
          >
            {getResultLabel(match.scoreTeam, match.scoreOpponent)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[1.15rem] border border-orange-500/15 bg-white/[0.03] px-3 py-3">
          <div className="min-w-0 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">
              {leftLabel}
            </div>
            <div className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-white">
              {leftTeam}
            </div>
          </div>

          <div className="inline-flex min-w-[84px] items-center justify-center rounded-2xl border border-orange-500 bg-orange-500 px-3 py-2 text-lg font-extrabold tracking-tight text-white shadow-[0_12px_24px_-14px_rgba(255,122,0,0.9)]">
            {leftScore} - {rightScore}
          </div>

          <div className="min-w-0 text-left">
            <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">
              {rightLabel}
            </div>
            <div className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-white">
              {rightTeam}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white/80">
            <Clock3 size={14} className="text-orange-400" />
            <span className="font-medium">{formatDate(match.matchDate)}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white/80">
            <MapPin size={14} className="text-orange-400" />
            <span className="font-medium">{match.location}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white/80">
            <Trophy size={14} className="text-orange-400" />
            <span className="font-medium">
              {match.isHome ? "Domicile" : "Extérieur"}
            </span>
          </div>
        </div>

        {match.scorers ? (
          <div className="mt-3 rounded-[1rem] border border-orange-500/15 bg-orange-500/8 px-3 py-2 text-sm text-white/80">
            <span className="font-bold text-white">Buteurs :</span>{" "}
            <span className="whitespace-pre-line">
              {formatRepeatedPlayers(match.scorers)}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function UpcomingCard({ match }: { match: HomeMatch }) {
  const venueBadge = getVenueBadge(match);
  const leftTeam = match.isHome ? match.team : match.opponent;
  const rightTeam = match.isHome ? match.opponent : match.team;

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-neutral-200 bg-white p-4 text-neutral-900 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-[0_20px_48px_-28px_rgba(255,122,0,0.24)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-orange-500/8 blur-2xl transition duration-300 group-hover:bg-orange-500/16" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-700">
                {match.category}
              </div>

              <div
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${venueBadge.className}`}
              >
                {venueBadge.label}
              </div>
            </div>

            <h3 className="mt-2 text-base font-extrabold leading-tight text-neutral-900 sm:text-lg">
              {leftTeam} <span className="text-neutral-400">vs</span>{" "}
              {rightTeam}
            </h3>
          </div>

          <div
            className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getUpcomingStatusClasses(
              match.status,
            )}`}
          >
            {formatStatus(match.status)}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-700">
            <CalendarDays size={14} className="text-orange-500" />
            <span className="font-medium">{formatDate(match.matchDate)}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-700">
            <MapPin size={14} className="text-orange-500" />
            <span className="font-medium">{match.location}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-700">
            <Trophy size={14} className="text-orange-500" />
            <span className="font-medium">
              {match.isHome ? "Domicile" : "Extérieur"}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-[1.05rem] border border-orange-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black px-4 py-3 text-white">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                {match.isHome ? "CSV" : "ADV"}
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-white">
                {leftTeam}
              </div>
            </div>

            <div className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-300">
              Match
            </div>

            <div className="min-w-0 text-left">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                {match.isHome ? "ADV" : "CSV"}
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-white">
                {rightTeam}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function HomeWeekendMatches() {
  const matches = await getHomeWeekendMatches();
  const content = getWeekendContent();

  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <Container>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Week-end</Badge>
          <Badge>Matchs & résultats</Badge>
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              {content.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              {content.subtitle}
            </p>
          </div>

          <Link
            href="/calendrier"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
          >
            Voir tout le calendrier
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) =>
            hasScore(match) ? (
              <ResultCard key={match.id} match={match} />
            ) : (
              <UpcomingCard key={match.id} match={match} />
            ),
          )}
        </div>
      </Container>
    </section>
  );
}
