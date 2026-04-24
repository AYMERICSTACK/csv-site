import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { prisma } from "@/lib/prisma";
import MatchGoalsFields from "@/components/MatchGoalsFields";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Shield,
  Trophy,
} from "lucide-react";
import {
  hasOnlyOneScoreFilled,
  normalizeMatchStatus,
} from "@/lib/match-status";

type PageProps = {
  params: Promise<{ id: string }>;
};

const DISPLAY_TIME_ZONE = "Europe/Paris";

/* ================= HELPERS ================= */

function canManageMatches(role?: string | null) {
  return role === "admin" || role === "educateurs";
}

function parseLocalDateTime(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

/* ================= PAGE ================= */

export default async function EditMatchPage({ params }: PageProps) {
  const session = await auth();

  if (!session) redirect("/admin/login");
  if (!canManageMatches(session.user?.role)) redirect("/espace-club");

  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
  });

  if (!match) redirect("/admin/matchs");

  /* ================= NOUVEAU : BUTEURS ================= */

  const matchGoals = await prisma.matchGoal.findMany({
    where: { matchId: match.id },
    orderBy: { createdAt: "asc" },
    select: {
      scorerName: true,
      goals: true,
    },
  });

  /* ================= ACTION ================= */

  async function updateMatch(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session) redirect("/admin/login");
    if (!canManageMatches(session.user?.role)) redirect("/espace-club");

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

    /* ===== NOUVEAU : récupération buteurs ===== */

    const goalScorerNames = formData
      .getAll("goalScorerName")
      .map((v) => String(v || "").trim());

    const goalCounts = formData
      .getAll("goalCount")
      .map((v) => Math.max(1, Number(v || 1)));

    const matchGoals = goalScorerNames
      .map((name, i) => ({
        scorerName: name,
        goals: goalCounts[i] || 1,
      }))
      .filter((g) => g.scorerName.length > 0);

    const scorersValue =
      matchGoals.length > 0
        ? matchGoals
            .map((g) =>
              g.goals > 1 ? `${g.scorerName} x${g.goals}` : g.scorerName,
            )
            .join(", ")
        : "";

    /* ===== VALIDATIONS ===== */

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

    /* ===== TRANSACTION ===== */

    await prisma.$transaction([
      prisma.match.update({
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
          scorers: scorersValue || null,
        },
      }),

      prisma.matchGoal.deleteMany({
        where: { matchId: id },
      }),

      prisma.matchGoal.createMany({
        data: matchGoals.map((goal) => ({
          matchId: id,
          scorerName: goal.scorerName,
          goals: goal.goals,
          category,
        })),
      }),
    ]);

    revalidatePath("/admin/matchs");
    redirect("/admin/matchs");
  }

  /* ================= UI ================= */

  return (
    <Container>
      <div className="py-14">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Modifier le match</h2>

          <form action={updateMatch} className="mt-6 space-y-5">
            <input type="hidden" name="id" value={match.id} />

            <input
              name="category"
              defaultValue={match.category}
              className="input"
              placeholder="Catégorie"
            />

            <input
              name="team"
              defaultValue={match.team}
              className="input"
              placeholder="Équipe"
            />

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
                .toISOString()
                .slice(0, 16)}
              className="input"
            />

            <input
              name="location"
              defaultValue={match.location}
              className="input"
              placeholder="Lieu"
            />

            {/* ===== NOUVEAU BLOC ===== */}
            <div>
              <label className="label">Buteurs CS Viriat</label>

              <MatchGoalsFields initialGoals={matchGoals} />

              <p className="mt-2 text-xs text-neutral-500">
                Ajoute les buteurs. Le classement sera automatique.
              </p>
            </div>

            <button className="btn-primary">
              Enregistrer les modifications
            </button>
          </form>
        </section>
      </div>
    </Container>
  );
}
