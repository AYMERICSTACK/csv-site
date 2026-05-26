import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import { prisma } from "@/lib/prisma";
import MatchGoalsFields from "@/components/MatchGoalsFields";
import { CLUB_CATEGORIES } from "@/lib/categories";
import { CLUB_TEAMS } from "@/lib/teams";
import {
  hasOnlyOneScoreFilled,
  normalizeMatchStatus,
} from "@/lib/match-status";
import { requireRole } from "@/lib/auth-guard";

type PageProps = {
  params: Promise<{ id: string }>;
};

/* ================= HELPERS ================= */

function parseLocalDateTime(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

/* ================= PAGE ================= */

export default async function EditMatchPage({ params }: PageProps) {
  await requireRole(["admin", "educateurs"]);

  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
  });

  if (!match) redirect("/admin/matchs");

  const players = await prisma.player.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ category: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
  });

  const goalEvents = await prisma.matchEvent.findMany({
    where: {
      matchId: match.id,
      type: "GOAL",
    },
  });

  const assistEvents = await prisma.matchEvent.findMany({
    where: {
      matchId: match.id,
      type: "ASSIST",
    },
  });

  const safeCategory = CLUB_CATEGORIES.includes(
    match.category as (typeof CLUB_CATEGORIES)[number],
  )
    ? match.category
    : "";

  const safeTeam = CLUB_TEAMS.includes(
    match.team as (typeof CLUB_TEAMS)[number],
  )
    ? match.team
    : "";

  /* ================= ACTION ================= */

  async function updateMatch(formData: FormData) {
    "use server";

    await requireRole(["admin", "educateurs"]);

    const id = String(formData.get("id") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const team = String(formData.get("team") || "").trim();
    const opponent = String(formData.get("opponent") || "").trim();
    const matchDate = String(formData.get("matchDate") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const isHomeValue = String(formData.get("isHome") || "true");
    const status = String(formData.get("status") || "scheduled");
    const scoreTeamValue = String(formData.get("scoreTeam") || "").trim();
    const scoreOpponentValue = String(
      formData.get("scoreOpponent") || "",
    ).trim();

    const goalPlayerIds = formData
      .getAll("goalPlayerId")
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    const assistPlayerIds = formData
      .getAll("assistPlayerId")
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    if (!id || !category || !team || !opponent || !matchDate || !location) {
      throw new Error("Champs manquants.");
    }

    if (hasOnlyOneScoreFilled(scoreTeamValue, scoreOpponentValue)) {
      throw new Error("Les deux scores doivent être remplis.");
    }

    const normalizedStatus = normalizeMatchStatus(
      status,
      scoreTeamValue,
      scoreOpponentValue,
    );

    const selectedGoalPlayers = await prisma.player.findMany({
      where: {
        id: {
          in: goalPlayerIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const scorersText = goalPlayerIds
      .map((playerId) => {
        const player = selectedGoalPlayers.find((p) => p.id === playerId);
        return player ? `${player.firstName} ${player.lastName}` : null;
      })
      .filter(Boolean)
      .join(", ");

    const previousEvents = await prisma.matchEvent.findMany({
      where: { matchId: id },
      select: { playerId: true },
    });

    const eventsData = [
      ...goalPlayerIds.map((playerId) => ({
        matchId: id,
        playerId,
        type: "GOAL",
      })),
      ...assistPlayerIds.map((playerId) => ({
        matchId: id,
        playerId,
        type: "ASSIST",
      })),
    ];

    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id },
        data: {
          category,
          team,
          opponent,
          matchDate: parseLocalDateTime(matchDate),
          location,
          isHome: isHomeValue === "true",
          status: normalizedStatus,
          scoreTeam: scoreTeamValue ? Number(scoreTeamValue) : null,
          scoreOpponent: scoreOpponentValue ? Number(scoreOpponentValue) : null,
          scorers: scorersText || null,
        },
      });

      await tx.matchEvent.deleteMany({
        where: { matchId: id },
      });

      if (eventsData.length > 0) {
        await tx.matchEvent.createMany({
          data: eventsData,
        });
      }
    });

    const season = "2025/2026";
    const affectedPlayerIds = Array.from(
      new Set([
        ...previousEvents.map((event) => event.playerId),
        ...goalPlayerIds,
        ...assistPlayerIds,
      ]),
    );

    await Promise.all(
      affectedPlayerIds.map(async (playerId) => {
        const [goals, assists] = await Promise.all([
          prisma.matchEvent.count({
            where: {
              playerId,
              type: "GOAL",
            },
          }),
          prisma.matchEvent.count({
            where: {
              playerId,
              type: "ASSIST",
            },
          }),
        ]);

        await prisma.playerStat.upsert({
          where: {
            playerId_season: {
              playerId,
              season,
            },
          },
          update: {
            goals,
            assists,
          },
          create: {
            playerId,
            season,
            goals,
            assists,
          },
        });
      }),
    );

    revalidatePath("/");
    revalidatePath("/calendrier");
    revalidatePath("/admin/matchs");
    revalidatePath(`/admin/matchs/${id}/edit`);
    revalidatePath("/admin/equipes");
    revalidatePath(
      `/admin/equipes/${team
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}`,
    );
    revalidatePath("/classements");

    redirect("/admin/matchs");
  }

  const backHref = safeTeam
    ? `/admin/equipes/${safeTeam
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}`
    : "/admin/matchs";

  return (
    <Container>
      <div className="py-14">
        <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.55)]">
          <div className="relative p-6 text-white md:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-900">
                    Match
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                    {safeTeam || match.team}
                  </span>
                </div>

                <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                  Modifier le match
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                  Mettez à jour les informations du match, le score, les buteurs
                  et les passeurs.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={backHref}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    ← Retour à l’équipe
                  </a>

                  <a
                    href="/admin/matchs"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Tous les matchs
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase text-white/60">
                  Score actuel
                </div>
                <div className="mt-1 text-3xl font-black">
                  {match.scoreTeam ?? "-"} - {match.scoreOpponent ?? "-"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <form action={updateMatch} className="mt-8">
          <input type="hidden" name="id" value={match.id} />

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                    Informations
                  </div>
                  <h2 className="mt-1 text-2xl font-black text-neutral-950">
                    Détails du match
                  </h2>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <select
                    name="category"
                    defaultValue={safeCategory}
                    className="input"
                  >
                    <option value="">Sélectionner une catégorie</option>

                    {CLUB_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <select name="team" defaultValue={safeTeam} className="input">
                    <option value="">Sélectionner une équipe</option>

                    {CLUB_TEAMS.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>

                  <input
                    name="opponent"
                    defaultValue={match.opponent}
                    className="input"
                    placeholder="Adversaire"
                  />

                  <input
                    name="matchDate"
                    type="datetime-local"
                    defaultValue={new Date(match.matchDate)
                      .toLocaleString("sv-SE", {
                        timeZone: "Europe/Paris",
                      })
                      .replace(" ", "T")
                      .slice(0, 16)}
                    className="input"
                  />

                  <input
                    name="location"
                    defaultValue={match.location}
                    className="input md:col-span-2"
                    placeholder="Lieu"
                  />
                </div>
              </section>

              <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                    Buteurs / Passeurs
                  </div>
                  <h2 className="mt-1 text-2xl font-black text-neutral-950">
                    Actions CS Viriat
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    Ajoutez les buteurs et les passeurs. Les classements seront
                    mis à jour automatiquement.
                  </p>
                </div>

                <div className="mt-6">
                  <MatchGoalsFields
                    players={players}
                    matchCategory={safeCategory}
                    matchTeam={match.team}
                    initialGoals={goalEvents.map((event) => ({
                      playerId: event.playerId,
                    }))}
                    initialAssists={assistEvents.map((event) => ({
                      playerId: event.playerId,
                    }))}
                  />
                </div>
              </section>
            </div>

            <aside className="xl:sticky xl:top-24 xl:self-start">
              <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                    Résultat
                  </div>
                  <h2 className="mt-1 text-2xl font-black text-neutral-950">
                    Score & statut
                  </h2>
                </div>

                <div className="mt-6 space-y-4">
                  <select
                    name="status"
                    defaultValue={match.status}
                    className="input"
                  >
                    <option value="scheduled">Programmé</option>
                    <option value="finished">Terminé</option>
                    <option value="postponed">Reporté</option>
                    <option value="cancelled">Annulé</option>
                  </select>

                  <select
                    name="isHome"
                    defaultValue={match.isHome ? "true" : "false"}
                    className="input"
                  >
                    <option value="true">Domicile</option>
                    <option value="false">Extérieur</option>
                  </select>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="scoreTeam"
                      type="number"
                      min="0"
                      defaultValue={match.scoreTeam ?? ""}
                      className="input"
                      placeholder="CSV"
                    />

                    <input
                      name="scoreOpponent"
                      type="number"
                      min="0"
                      defaultValue={match.scoreOpponent ?? ""}
                      className="input"
                      placeholder="Adv."
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <button className="rounded-xl bg-csv-orange px-5 py-3 text-sm font-black text-white transition hover:opacity-90">
                    Enregistrer
                  </button>

                  <a
                    href={backHref}
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Annuler
                  </a>
                </div>
              </section>
            </aside>
          </div>
        </form>
      </div>
    </Container>
  );
}
