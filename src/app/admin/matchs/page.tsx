import { requireRole } from "@/lib/auth-guard";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CLUB_CATEGORIES } from "@/lib/categories";
import { CLUB_TEAMS } from "@/lib/teams";
import MatchGoalsFields from "@/components/MatchGoalsFields";
import AdminMatchesBoard from "@/components/AdminMatchesBoard";
import {
  hasOnlyOneScoreFilled,
  normalizeMatchStatus,
} from "@/lib/match-status";
import { ArrowLeft, CalendarDays } from "lucide-react";

function parseLocalDateTime(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

async function refreshPlayerStats(playerIds: string[]) {
  const season = "2026/2027";
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
  const rawMatchDate = formData.get("matchDate") as string;

  const [datePart, timePart] = rawMatchDate.split("T");

  const [year, month, day] = datePart.split("-").map(Number);

  const [hours, minutes] = timePart.split(":").map(Number);

  const matchDate = new Date(year, month - 1, day, hours, minutes);
  const location = String(formData.get("location") || "").trim();
  const isHomeValue = String(formData.get("isHome") || "true").trim();
  const status = String(formData.get("status") || "scheduled").trim();
  const scoreTeamValue = String(formData.get("scoreTeam") || "").trim();
  const scoreOpponentValue = String(formData.get("scoreOpponent") || "").trim();

  const goalPlayerIds = formData
    .getAll("goalPlayerId")
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const assistPlayerIds = formData
    .getAll("assistPlayerId")
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (!category || !team || !opponent || !matchDate || !location) {
    throw new Error("Tous les champs obligatoires doivent être remplis.");
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
}

async function deleteMatch(formData: FormData) {
  "use server";

  await requireRole(["admin", "educateurs"]);

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("ID du match manquant.");
  }

  const events = await prisma.matchEvent.findMany({
    where: { matchId: id },
    select: { playerId: true },
  });

  await prisma.match.delete({ where: { id } });
  await refreshPlayerStats(events.map((event) => event.playerId));

  revalidatePath("/");
  revalidatePath("/admin/matchs");
  revalidatePath("/calendrier");
  revalidatePath("/classements");
}

export default async function AdminMatchsPage() {
  const { availableRoles, user } = await requireRole(["admin", "educateurs"]);

  const role = availableRoles.includes("admin") ? "admin" : user.role;
  const backHref = role === "admin" ? "/admin" : "/espace-club";
  const backLabel = role === "admin" ? "Retour admin" : "Retour espace club";

  const matches = await prisma.match.findMany({
    orderBy: { matchDate: "desc" },
  });

  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: [
      { category: "asc" },
      { team: "asc" },
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  const upcomingMatches = matches.filter(
    (match) => match.status !== "finished" && match.status !== "cancelled",
  );
  const finishedMatches = matches.filter(
    (match) => match.status === "finished",
  );

  const serializedMatches = matches.map((match) => ({
    ...match,
    matchDate: match.matchDate.toISOString(),
  }));

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 px-6 py-8 shadow-sm md:px-8 md:py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
          <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={backHref}>
                  <Badge>{role === "admin" ? "Admin" : "Espace club"}</Badge>
                </Link>

                <Link href="/admin/matchs">
                  <Badge>Matchs</Badge>
                </Link>
              </div>

              <div className="mt-4">
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={14} />
                  {backLabel}
                </Link>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Gestion des matchs
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Ajoute, consulte, modifie et supprime les rencontres du club
                depuis une interface claire, rapide et centralisée.
              </p>
            </div>

            <div className="relative flex flex-col items-start gap-4 md:items-end">
              <AdminLogoutButton />

              <div className="grid grid-cols-3 gap-2 text-white">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <div className="text-2xl font-black">{matches.length}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-white/55">
                    Matchs
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <div className="text-2xl font-black">
                    {upcomingMatches.length}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-white/55">
                    À venir
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <div className="text-2xl font-black">
                    {finishedMatches.length}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-white/55">
                    Terminés
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                <CalendarDays size={20} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-neutral-900">
                  Ajouter un match
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  Remplis les informations pour publier automatiquement la
                  rencontre sur le calendrier.
                </p>
              </div>
            </div>

            <form action={createMatch} className="mt-6 space-y-5">
              <div>
                <label htmlFor="category" className="label">
                  Catégorie
                </label>
                <select
                  id="category"
                  name="category"
                  className="input"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {CLUB_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="team" className="label">
                  Équipe
                </label>
                <select id="team" name="team" className="input" required>
                  <option value="">Sélectionner une équipe</option>
                  {CLUB_TEAMS.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="opponent" className="label">
                  Adversaire
                </label>
                <input
                  id="opponent"
                  name="opponent"
                  type="text"
                  placeholder="Ex : FC Bourg"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="matchDate" className="label">
                  Date et heure
                </label>
                <input
                  id="matchDate"
                  name="matchDate"
                  type="datetime-local"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="label">
                  Lieu
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Ex : Stade Pierre Brichon"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="isHome" className="label">
                  Type de rencontre
                </label>
                <select
                  id="isHome"
                  name="isHome"
                  defaultValue="true"
                  className="input"
                >
                  <option value="true">Domicile</option>
                  <option value="false">Extérieur</option>
                </select>
              </div>

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

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="scoreTeam" className="label">
                    Score CS Viriat
                  </label>
                  <input
                    id="scoreTeam"
                    name="scoreTeam"
                    type="number"
                    min="0"
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
                    placeholder="Ex : 1"
                    className="input"
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50/35 p-4">
                <div className="mb-4">
                  <div className="text-sm font-extrabold text-neutral-900">
                    Buteurs / passeurs
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    Sélectionne les joueurs de l’équipe choisie. Les stats
                    joueurs seront mises à jour automatiquement.
                  </p>
                </div>

                <MatchGoalsFields
                  players={players}
                  targetCategoryField="category"
                  targetTeamField="team"
                />
              </div>

              <button type="submit" className="btn-primary">
                Ajouter le match
              </button>
            </form>
          </div>

          <AdminMatchesBoard
            matches={serializedMatches}
            deleteAction={deleteMatch}
          />
        </div>
      </div>
    </Container>
  );
}
