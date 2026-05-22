import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasCurrentUserRole } from "@/lib/auth-guard";
import {
  hasOnlyOneScoreFilled,
  normalizeMatchStatus,
} from "@/lib/match-status";

function parseLocalDateTime(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
}

function normalizeScore(value: unknown) {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }

  return Number(value);
}

export async function POST(request: Request) {
  try {
    const access = await hasCurrentUserRole(["admin", "educateurs"]);

    if (!access.ok) {
      return access.reason === "unauthorized"
        ? unauthorizedResponse()
        : forbiddenResponse();
    }

    const body = await request.json();

    const {
      category,
      team,
      opponent,
      matchDate,
      location,
      isHome,
      status,
      scoreTeam,
      scoreOpponent,
      scorers,
    } = body;

    if (
      !category ||
      !team ||
      !opponent ||
      !matchDate ||
      !location ||
      typeof isHome !== "boolean" ||
      !status
    ) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis." },
        { status: 400 },
      );
    }

    if (hasOnlyOneScoreFilled(scoreTeam, scoreOpponent)) {
      return NextResponse.json(
        {
          error:
            "Tu dois renseigner les deux scores ou laisser les deux vides.",
        },
        { status: 400 },
      );
    }

    const normalizedScoreTeam = normalizeScore(scoreTeam);
    const normalizedScoreOpponent = normalizeScore(scoreOpponent);
    const normalizedStatus = normalizeMatchStatus(
      status,
      scoreTeam,
      scoreOpponent,
    );

    const createdMatch = await prisma.match.create({
      data: {
        category,
        team,
        opponent,
        matchDate: parseLocalDateTime(matchDate),
        location,
        isHome,
        status: normalizedStatus,
        scoreTeam: normalizedScoreTeam,
        scoreOpponent: normalizedScoreOpponent,
        scorers:
          typeof scorers === "string" && scorers.trim() !== ""
            ? scorers.trim()
            : null,
      },
    });

    revalidatePath("/");
    revalidatePath("/calendrier");
    revalidatePath("/admin/matchs");

    return NextResponse.json(createdMatch, { status: 201 });
  } catch (error) {
    console.error("Erreur POST match :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
