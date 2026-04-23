import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import { prisma } from "@/lib/prisma";

type WeekendWindow = {
  start: Date;
  end: Date;
};

function getHomeWeekendWindow(): WeekendWindow {
  const now = new Date();
  const day = now.getDay(); // 0=dimanche, 1=lundi, 2=mardi, 3=mercredi, 4=jeudi, 5=vendredi, 6=samedi

  let fridayStart: Date;

  // Lundi, mardi, mercredi => on montre encore le week-end passé
  if ([1, 2, 3].includes(day)) {
    fridayStart = new Date(now);
    fridayStart.setDate(now.getDate() - (day + 2)); // lundi->vendredi précédent, mardi->vendredi précédent, mercredi->vendredi précédent
  } else if (day === 0) {
    // Dimanche => vendredi de la même semaine
    fridayStart = new Date(now);
    fridayStart.setDate(now.getDate() - 2);
  } else if (day === 4) {
    // Jeudi => vendredi à venir
    fridayStart = new Date(now);
    fridayStart.setDate(now.getDate() + 1);
  } else if (day === 5) {
    // Vendredi => aujourd’hui
    fridayStart = new Date(now);
  } else {
    // Samedi => vendredi de la veille
    fridayStart = new Date(now);
    fridayStart.setDate(now.getDate() - 1);
  }

  // Important : comme les matchs sont saisis dès le jeudi,
  // on démarre la fenêtre au vendredi à 00:00
  fridayStart.setHours(0, 0, 0, 0);

  const end = new Date(fridayStart);
  end.setDate(fridayStart.getDate() + 5); // jusqu’au mercredi suivant
  end.setHours(23, 59, 59, 999);

  return {
    start: fridayStart,
    end,
  };
}

function getWeekendContent() {
  const now = new Date();
  const day = now.getDay(); // 0=dimanche, 1=lundi, ..., 6=samedi

  if ([4, 5].includes(day)) {
    return {
      title: "Matchs du week-end",
      subtitle:
        "Retrouvez les rencontres à venir du CS Viriat. Dès qu’un score est saisi, il s’affiche automatiquement sur la carte du match.",
    };
  }

  if ([6, 0].includes(day)) {
    return {
      title: "Matchs en cours",
      subtitle:
        "Suivez les rencontres du week-end du CS Viriat. Les matchs à venir et les premiers résultats s’affichent automatiquement.",
    };
  }

  return {
    title: "Résultats du week-end",
    subtitle:
      "Retrouvez les résultats du week-end du CS Viriat. Les scores renseignés remplacent automatiquement les affiches des matchs.",
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

function formatDate(date: Date) {
  return new Date(date).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasScore(match: {
  scoreTeam: number | null;
  scoreOpponent: number | null;
}) {
  return match.scoreTeam !== null && match.scoreOpponent !== null;
}

function getMatchStateLabel(match: {
  status: string;
  scoreTeam: number | null;
  scoreOpponent: number | null;
}) {
  if (hasScore(match)) {
    if ((match.scoreTeam ?? 0) > (match.scoreOpponent ?? 0)) return "Victoire";
    if ((match.scoreTeam ?? 0) < (match.scoreOpponent ?? 0)) return "Défaite";
    return "Nul";
  }

  switch (match.status) {
    case "postponed":
      return "Reporté";
    case "cancelled":
      return "Annulé";
    default:
      return "À venir";
  }
}

function getMatchStateClasses(match: {
  status: string;
  scoreTeam: number | null;
  scoreOpponent: number | null;
}) {
  if (hasScore(match)) {
    if ((match.scoreTeam ?? 0) > (match.scoreOpponent ?? 0)) {
      return "border border-green-200 bg-green-100 text-green-800";
    }

    if ((match.scoreTeam ?? 0) < (match.scoreOpponent ?? 0)) {
      return "border border-red-200 bg-red-100 text-red-800";
    }

    return "border border-amber-200 bg-amber-100 text-amber-800";
  }

  switch (match.status) {
    case "postponed":
      return "border border-amber-200 bg-amber-100 text-amber-800";
    case "cancelled":
      return "border border-red-200 bg-red-100 text-red-800";
    default:
      return "border border-blue-200 bg-blue-100 text-blue-800";
  }
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

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {matches.map((match: any) => {
            const isResult = hasScore(match);

            return (
              <article
                key={match.id}
                className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {match.category}
                  </div>

                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getMatchStateClasses(
                      match,
                    )}`}
                  >
                    {getMatchStateLabel(match)}
                  </div>
                </div>

                {isResult ? (
                  <>
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

                    {match.scorers ? (
                      <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                        <span className="font-semibold text-neutral-900">
                          Buteurs :
                        </span>{" "}
                        {match.scorers}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
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
                  </>
                )}

                <div className="mt-4 text-sm text-neutral-600">
                  {formatDate(match.matchDate)}
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
