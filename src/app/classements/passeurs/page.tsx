import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Container from "@/components/Container";

type PageProps = {
  searchParams: Promise<{
    categorie?: string;
  }>;
};

export default async function ClassementPasseursPage({
  searchParams,
}: PageProps) {
  const { categorie } = await searchParams;

  const players = await prisma.player.findMany({
    include: {
      stats: true,
    },
    orderBy: [{ category: "asc" }, { team: "asc" }, { lastName: "asc" }],
  });

  const categories = [
    "Toutes",
    ...Array.from(
      new Set(
        players
          .map((player) => player.category)
          .filter((category): category is string => Boolean(category)),
      ),
    ),
  ];

  const activeCategory = categorie || "Toutes";

  const passers = players
    .map((player) => ({
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      team: player.team,
      category: player.category,
      assists: player.stats.reduce(
        (total, stat) => total + (stat.assists || 0),
        0,
      ),
    }))
    .filter((player) => player.assists > 0)
    .filter(
      (player) =>
        activeCategory === "Toutes" || player.category === activeCategory,
    )
    .sort((a, b) => b.assists - a.assists);

  return (
    <Container>
      <div className="py-14">
        <Link
          href="/classements"
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 transition hover:text-neutral-900"
        >
          ← Retour aux classements
        </Link>

        <div className="mt-6 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-2xl">
                🅰️
              </div>

              <div>
                <h1 className="text-3xl font-black text-neutral-950">
                  Tous les passeurs
                </h1>

                <p className="text-sm text-neutral-500">
                  Classement complet des passeurs du club
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const href =
                  category === "Toutes"
                    ? "/classements/passeurs"
                    : `/classements/passeurs?categorie=${encodeURIComponent(
                        category,
                      )}`;

                const isActive = activeCategory === category;

                return (
                  <Link
                    key={category}
                    href={href}
                    className={`rounded-full px-4 py-2 text-sm font-black transition ${
                      isActive
                        ? "bg-sky-600 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-sky-50 hover:text-sky-700"
                    }`}
                  >
                    {category}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {passers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
                    #{index + 1}
                  </div>

                  <div>
                    <div className="font-bold text-neutral-950">
                      {player.firstName} {player.lastName}
                    </div>

                    <div className="text-sm text-neutral-500">
                      {player.team}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-sky-600">
                    {player.assists}
                  </div>

                  <div className="text-xs uppercase tracking-wide text-neutral-400">
                    passes
                  </div>
                </div>
              </div>
            ))}

            {!passers.length && (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm font-semibold text-neutral-500">
                Aucun passeur enregistré dans cette catégorie.
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
