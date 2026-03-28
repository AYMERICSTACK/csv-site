import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/prisma";

function getRecentResultsRange() {
  const end = new Date();

  const start = new Date();
  start.setDate(end.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  return {
    start,
    end,
  };
}

async function getRecentResults() {
  const range = getRecentResultsRange();

  return prisma.match.findMany({
    where: {
      status: "finished",
      scoreTeam: {
        not: null,
      },
      scoreOpponent: {
        not: null,
      },
      matchDate: {
        gte: range.start,
        lte: range.end,
      },
    },
    orderBy: {
      matchDate: "desc",
    },
    take: 6,
  });
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getResultLabel(scoreTeam: number, scoreOpponent: number) {
  if (scoreTeam > scoreOpponent) return "Victoire";
  if (scoreTeam < scoreOpponent) return "Défaite";
  return "Nul";
}

function getResultBadgeClasses(scoreTeam: number, scoreOpponent: number) {
  if (scoreTeam > scoreOpponent) {
    return "border border-green-200 bg-green-100 text-green-800";
  }

  if (scoreTeam < scoreOpponent) {
    return "border border-red-200 bg-red-100 text-red-800";
  }

  return "border border-amber-200 bg-amber-100 text-amber-800";
}

export default async function WeekendResults() {
  const results = await getRecentResults();

  if (results.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <Container>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Résultats</Badge>
          <Badge>Récents</Badge>
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Résultats récents
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Retrouvez les dernières performances des équipes du CS Viriat sur
              les 7 derniers jours.
            </p>
          </div>

          <Link
            href="/calendrier"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
          >
            Voir tout le calendrier
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {results.map((match) => (
            <article
              key={match.id}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {match.category}
                </div>

                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getResultBadgeClasses(
                    match.scoreTeam!,
                    match.scoreOpponent!,
                  )}`}
                >
                  {getResultLabel(match.scoreTeam!, match.scoreOpponent!)}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-500">
                    CSV
                  </div>
                  <div className="text-base font-extrabold text-neutral-900">
                    {match.team}
                  </div>
                </div>

                <div className="rounded-2xl bg-csv-orange/10 px-4 py-3 text-center">
                  <div className="text-2xl font-extrabold tracking-tight text-csv-black">
                    {match.scoreTeam} - {match.scoreOpponent}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                    Score final
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-sm font-semibold text-neutral-500">
                    Adversaire
                  </div>
                  <div className="text-base font-extrabold text-neutral-900">
                    {match.opponent}
                  </div>
                </div>
              </div>

              {match.status === "finished" && match.scorers ? (
                <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-900">
                    Buteurs :
                  </span>{" "}
                  {match.scorers}
                </div>
              ) : null}

              <div className="mt-4 text-sm text-neutral-600">
                {formatDate(match.matchDate)}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
