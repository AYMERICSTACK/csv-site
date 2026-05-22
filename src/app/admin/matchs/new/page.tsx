import { requireRole } from "@/lib/auth-guard";
import { auth } from "@/auth";
import Container from "@/components/Container";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import MatchGoalsFields from "@/components/MatchGoalsFields";
import NewMatchSmartForm from "@/components/NewMatchSmartForm";
import {
  hasOnlyOneScoreFilled,
  normalizeMatchStatus,
} from "@/lib/match-status";
import { ArrowLeft, CalendarDays, CheckCircle2 } from "lucide-react";

async function refreshPlayerStats(playerIds: string[]) {
  const season = "2025/2026";
  const uniquePlayerIds = Array.from(new Set(playerIds)).filter(Boolean);

  for (const playerId of uniquePlayerIds) {
    const goals = await prisma.matchEvent.count({
      where: { playerId, type: "GOAL" },
    });

    const assists = await prisma.matchEvent.count({
      where: { playerId, type: "ASSIST" },
    });

    await prisma.playerStat.upsert({
      where: {
        playerId_season: {
          playerId,
          season,
        },
      },
      update: { goals, assists },
      create: { playerId, season, goals, assists },
    });
  }
}

async function createMatch(formData: FormData) {
  "use server";

  await requireRole(["admin", "educateurs"]);

  const category = String(formData.get("category") || "").trim();
  const team = String(formData.get("team") || "").trim();
  const opponent = String(formData.get("opponent") || "").trim();
  const rawMatchDate = String(formData.get("matchDate") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const isHomeValue = String(formData.get("isHome") || "true").trim();
  const status = String(formData.get("status") || "scheduled").trim();
  const scoreTeamValue = String(formData.get("scoreTeam") || "").trim();
  const scoreOpponentValue = String(formData.get("scoreOpponent") || "").trim();

  if (!category || !team || !opponent || !rawMatchDate || !location) {
    throw new Error("Tous les champs obligatoires doivent être remplis.");
  }

  const [datePart, timePart] = rawMatchDate.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const matchDate = new Date(year, month - 1, day, hours, minutes);

  const goalPlayerIds = formData
    .getAll("goalPlayerId")
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const assistPlayerIds = formData
    .getAll("assistPlayerId")
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (hasOnlyOneScoreFilled(scoreTeamValue, scoreOpponentValue)) {
    throw new Error("Les deux scores doivent être remplis.");
  }

  const normalizedStatus = normalizeMatchStatus(
    status,
    scoreTeamValue,
    scoreOpponentValue,
  );

  const selectedGoalPlayers = await prisma.player.findMany({
    where: { id: { in: goalPlayerIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const scorersText = goalPlayerIds
    .map((playerId) => {
      const player = selectedGoalPlayers.find((p) => p.id === playerId);
      return player ? `${player.firstName} ${player.lastName}` : null;
    })
    .filter(Boolean)
    .join(", ");

  const createdMatch = await prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: {
        category,
        team,
        opponent,
        matchDate,
        location,
        isHome: isHomeValue === "true",
        status: normalizedStatus,
        scoreTeam: scoreTeamValue ? Number(scoreTeamValue) : null,
        scoreOpponent: scoreOpponentValue ? Number(scoreOpponentValue) : null,
        scorers: scorersText || null,
      },
    });

    const eventsData = [
      ...goalPlayerIds.map((playerId) => ({
        matchId: match.id,
        playerId,
        type: "GOAL",
      })),
      ...assistPlayerIds.map((playerId) => ({
        matchId: match.id,
        playerId,
        type: "ASSIST",
      })),
    ];

    if (eventsData.length > 0) {
      await tx.matchEvent.createMany({ data: eventsData });
    }

    return match;
  });

  await refreshPlayerStats([...goalPlayerIds, ...assistPlayerIds]);

  revalidatePath("/");
  revalidatePath("/admin/matchs");
  revalidatePath(`/admin/matchs/${createdMatch.id}/edit`);
  revalidatePath("/calendrier");
  revalidatePath("/classements");

  redirect("/admin/matchs");
}

export default async function NewMatchPage({
  searchParams,
}: {
  searchParams?: Promise<{ noFavorite?: string }>;
}) {
  await requireRole(["admin", "educateurs"]);

  const resolvedSearchParams = await searchParams;

  const shouldUseFavorite = resolvedSearchParams?.noFavorite !== "1";

  const session = await auth();

  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          favoriteTeam: {
            select: {
              category: true,
            },
          },
        },
      })
    : null;

  const favoriteTeam = shouldUseFavorite
    ? (currentUser?.favoriteTeam?.category ?? "")
    : "";

  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: [
      { category: "asc" },
      { team: "asc" },
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  return (
    <Container>
      <div className="pb-28 pt-6 md:py-14">
        <div className="mb-5">
          <Link
            href="/admin/matchs"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-black text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            <ArrowLeft size={16} />
            Retour aux matchs
          </Link>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 shadow-sm">
          <div className="relative px-5 py-7 text-white md:px-8 md:py-10">
            <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-orange-500/25 blur-3xl" />

            <div className="relative flex items-start gap-4">
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
                <CalendarDays size={22} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                  Nouveau match
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                  Ajouter une rencontre
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
                  Une page dédiée, plus lisible sur téléphone, pour créer un
                  match sans perdre la liste des rencontres existantes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {favoriteTeam && (
          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-800">
            ⭐ Équipe favorite préselectionnée : {favoriteTeam}
          </div>
        )}

        <form action={createMatch} className="mt-6 space-y-5">
          <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800">
                1
              </div>

              <div>
                <h2 className="text-lg font-black text-neutral-950">
                  Informations principales
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Choisis l’équipe, l’adversaire, la date et le lieu.
                </p>
              </div>
            </div>

            <NewMatchSmartForm favoriteTeam={favoriteTeam} />
          </section>

          <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800">
                2
              </div>

              <div>
                <h2 className="text-lg font-black text-neutral-950">
                  Résultat et statut
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Tu peux laisser le score vide si le match n’a pas encore été
                  joué.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label htmlFor="status" className="label">
                  Statut
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue="scheduled"
                  className="input"
                >
                  <option value="scheduled">Programmé</option>
                  <option value="postponed">Reporté</option>
                  <option value="cancelled">Annulé</option>
                  <option value="finished">Terminé</option>
                </select>
              </div>

              <div>
                <label htmlFor="scoreTeam" className="label">
                  Score CS Viriat
                </label>

                <input
                  id="scoreTeam"
                  name="scoreTeam"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Ex : 2"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="scoreOpponent" className="label">
                  Score adversaire
                </label>

                <input
                  id="scoreOpponent"
                  name="scoreOpponent"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Ex : 1"
                  className="input"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-orange-100 bg-orange-50/35 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white">
                3
              </div>

              <div>
                <h2 className="text-lg font-black text-neutral-950">
                  Buteurs / passeurs
                </h2>

                <p className="mt-1 text-sm text-neutral-600">
                  Sélectionne les joueurs de l’équipe choisie. Les statistiques
                  seront mises à jour automatiquement.
                </p>
              </div>
            </div>

            <MatchGoalsFields
              players={players}
              targetCategoryField="category"
              targetTeamField="team"
            />
          </section>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-4 shadow-[0_-12px_35px_-22px_rgba(0,0,0,0.45)] backdrop-blur md:sticky md:bottom-4 md:rounded-[1.5rem] md:border md:shadow-sm">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <Link
                href="/admin/matchs"
                className="hidden rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex"
              >
                Annuler
              </Link>

              <button
                type="submit"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
              >
                <CheckCircle2 size={18} />
                Publier le match
              </button>
            </div>
          </div>
        </form>
      </div>
    </Container>
  );
}
