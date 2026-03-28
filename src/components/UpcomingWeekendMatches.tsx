import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/prisma";

function getUpcomingWeekendRange() {
  const now = new Date();
  const day = now.getDay(); // 0=dimanche, 1=lundi, ..., 4=jeudi, 5=vendredi, 6=samedi

  // Affichage à partir du jeudi
  if (![4, 5, 6, 0].includes(day)) {
    return null;
  }

  // Si on est dimanche, on garde seulement les matchs du dimanche
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

  // À partir du jeudi, on vise le vendredi 18h jusqu'au dimanche soir
  const friday = new Date(now);
  friday.setHours(18, 0, 0, 0);

  let diffToFriday = 0;
  if (day === 4) diffToFriday = 1; // jeudi -> vendredi
  if (day === 5) diffToFriday = 0; // vendredi -> vendredi
  if (day === 6) diffToFriday = -1; // samedi -> vendredi de la veille

  friday.setDate(now.getDate() + diffToFriday);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: friday,
    end: sunday,
  };
}

async function getUpcomingWeekendMatches() {
  const range = getUpcomingWeekendRange();

  if (!range) {
    return [];
  }

  return prisma.match.findMany({
    where: {
      matchDate: {
        gte: range.start,
        lte: range.end,
      },
      status: {
        not: "finished",
      },
    },
    orderBy: {
      matchDate: "asc",
    },
    take: 6,
  });
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string) {
  switch (status) {
    case "scheduled":
      return "À venir";
    case "postponed":
      return "Reporté";
    case "cancelled":
      return "Annulé";
    default:
      return "À venir";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "postponed":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-blue-100 text-blue-800 border border-blue-200";
  }
}

export default async function UpcomingWeekendMatches() {
  const matches = await getUpcomingWeekendMatches();

  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <Container>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Matchs</Badge>
          <Badge>À venir</Badge>
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Prochains matchs du week-end
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Retrouvez les rencontres à venir des équipes du CS Viriat.
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
          {matches.map((match: any) (
            <article
              key={match.id}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {match.category}
                </div>

                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                    match.status,
                  )}`}
                >
                  {getStatusLabel(match.status)}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-extrabold text-neutral-900">
                  {match.team}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  vs {match.opponent}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="space-y-2 text-sm text-neutral-700">
                  <div>
                    <span className="font-semibold text-neutral-900">
                      Date :
                    </span>{" "}
                    {formatDate(match.matchDate)}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">
                      Lieu :
                    </span>{" "}
                    {match.location}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">
                      Type :
                    </span>{" "}
                    {match.isHome ? "Domicile" : "Extérieur"}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
