import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, CheckCircle2, MapPin, Trophy } from "lucide-react";
import Container from "@/components/Container";
import MatchGoalsFields from "@/components/MatchGoalsFields";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { refreshPlayerStats } from "@/lib/player-stats";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date);
}

export default async function QuickResultPage({ params }: PageProps) {
  await requireRole(["admin", "educateurs"]);
  const { id } = await params;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) redirect("/admin/matchs");

  const [players, goalEvents, assistEvents] = await Promise.all([
    prisma.player.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.matchEvent.findMany({ where: { matchId: id, type: "GOAL" } }),
    prisma.matchEvent.findMany({ where: { matchId: id, type: "ASSIST" } }),
  ]);

  async function saveResult(formData: FormData) {
    "use server";
    await requireRole(["admin", "educateurs"]);

    const scoreTeamValue = String(formData.get("scoreTeam") || "").trim();
    const scoreOpponentValue = String(formData.get("scoreOpponent") || "").trim();

    if (scoreTeamValue === "" || scoreOpponentValue === "") {
      throw new Error("Renseigne les deux scores.");
    }

    const scoreTeam = Number(scoreTeamValue);
    const scoreOpponent = Number(scoreOpponentValue);

    if (
      !Number.isInteger(scoreTeam) ||
      !Number.isInteger(scoreOpponent) ||
      scoreTeam < 0 ||
      scoreOpponent < 0
    ) {
      throw new Error("Le score doit contenir deux nombres entiers positifs.");
    }

    const goalPlayerIds = formData
      .getAll("goalPlayerId")
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    const assistPlayerIds = formData
      .getAll("assistPlayerId")
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    const selectedGoalPlayers = await prisma.player.findMany({
      where: { id: { in: goalPlayerIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const scorersText = goalPlayerIds
      .map((playerId) => {
        const player = selectedGoalPlayers.find((item) => item.id === playerId);
        return player ? `${player.firstName} ${player.lastName}` : null;
      })
      .filter(Boolean)
      .join(", ");

    const previousEvents = await prisma.matchEvent.findMany({
      where: { matchId: id },
      select: { playerId: true },
    });

    const eventsData = [
      ...goalPlayerIds.map((playerId) => ({ matchId: id, playerId, type: "GOAL" })),
      ...assistPlayerIds.map((playerId) => ({ matchId: id, playerId, type: "ASSIST" })),
    ];

    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id },
        data: {
          scoreTeam,
          scoreOpponent,
          status: "finished",
          scorers: scorersText || null,
        },
      });

      await tx.matchEvent.deleteMany({ where: { matchId: id } });

      if (eventsData.length > 0) {
        await tx.matchEvent.createMany({ data: eventsData });
      }
    });

    const affectedPlayerIds = Array.from(
      new Set([
        ...previousEvents.map((event) => event.playerId),
        ...goalPlayerIds,
        ...assistPlayerIds,
      ]),
    );

    await refreshPlayerStats(affectedPlayerIds);

    revalidatePath("/");
    revalidatePath("/calendrier");
    revalidatePath("/classements");
    revalidatePath("/espace-educateurs");
    revalidatePath("/admin/matchs");
    revalidatePath(`/admin/matchs/${id}/edit`);
    revalidatePath(`/admin/matchs/${id}/resultat`);

    redirect("/admin/matchs");
  }

  return (
    <Container>
      <div className="pb-24 pt-6 md:py-14">
        <section className="relative overflow-hidden rounded-[2rem] bg-neutral-950 p-6 text-white shadow-sm md:p-8">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative">
            <Link
              href="/admin/matchs"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/15"
            >
              <ArrowLeft size={14} /> Retour aux matchs
            </Link>

            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
                  Saisie express · Après-match
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                  Saisir le résultat
                </h1>
                <p className="mt-3 text-sm text-white/65 md:text-base">
                  Score, buteurs, passeurs. C’est tout.
                </p>
              </div>

              <Link
                href={`/admin/matchs/${id}/edit`}
                className="text-sm font-bold text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white"
              >
                Ouvrir la fiche complète
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-orange-200 bg-orange-50 p-5 shadow-sm md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-neutral-400">CS Viriat</div>
              <div className="mt-1 text-2xl font-black text-neutral-950">{match.team}</div>
            </div>
            <Trophy className="hidden text-orange-500 md:block" size={26} />
            <div className="md:text-right">
              <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Adversaire</div>
              <div className="mt-1 text-2xl font-black text-neutral-950">{match.opponent}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-orange-200/70 pt-4 text-sm font-semibold text-neutral-600">
            <span>{formatMatchDate(match.matchDate)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {match.location}</span>
            <span>{match.isHome ? "Domicile" : "Extérieur"}</span>
          </div>
        </section>

        <form action={saveResult} className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr] xl:items-start">
          <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm xl:sticky xl:top-24 md:p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Étape 1</div>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">Le score</h2>

            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <label className="min-w-0">
                <span className="mb-2 block text-center text-xs font-black uppercase text-neutral-500">CSV</span>
                <input
                  name="scoreTeam"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  required
                  defaultValue={match.scoreTeam ?? ""}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-4 text-center text-4xl font-black outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="0"
                />
              </label>

              <div className="pb-4 text-2xl font-black text-neutral-300">–</div>

              <label className="min-w-0">
                <span className="mb-2 block text-center text-xs font-black uppercase text-neutral-500">ADV.</span>
                <input
                  name="scoreOpponent"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  required
                  defaultValue={match.scoreOpponent ?? ""}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-4 text-center text-4xl font-black outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="0"
                />
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
              <div className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0" size={17} /><span>À l’enregistrement, le match passe automatiquement en <strong>Terminé</strong>.</span></div>
            </div>

            <button className="mt-5 w-full rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400">
              Enregistrer le résultat
            </button>
          </section>

          <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Étape 2</div>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">Buteurs & passeurs</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Sélectionne seulement les joueurs concernés. Les statistiques 2026/2027 seront recalculées automatiquement.
            </p>

            <div className="mt-6">
              <MatchGoalsFields
                players={players}
                matchCategory={match.category}
                matchTeam={match.team}
                initialGoals={goalEvents.map((event) => ({ playerId: event.playerId }))}
                initialAssists={assistEvents.map((event) => ({ playerId: event.playerId }))}
              />
            </div>

            <button className="mt-6 w-full rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 xl:hidden">
              Enregistrer le résultat
            </button>
          </section>
        </form>
      </div>
    </Container>
  );
}
