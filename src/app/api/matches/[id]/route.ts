import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

async function requireMatchManager() {
  const session = await auth();

  if (!session) {
    return { ok: false as const, response: unauthorizedResponse() };
  }

  if (session.user?.role !== "admin" && session.user?.role !== "educateurs") {
    return { ok: false as const, response: forbiddenResponse() };
  }

  return { ok: true as const };
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const access = await requireMatchManager();
    if (!access.ok) return access.response;

    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Erreur GET match :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const access = await requireMatchManager();
    if (!access.ok) return access.response;

    const { id } = await params;
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

    const existingMatch = await prisma.match.findUnique({
      where: { id },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const normalizedScoreTeam = normalizeScore(scoreTeam);
    const normalizedScoreOpponent = normalizeScore(scoreOpponent);
    const normalizedStatus = normalizeMatchStatus(
      status,
      scoreTeam,
      scoreOpponent,
    );

    const updatedMatch = await prisma.match.update({
      where: { id },
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
    revalidatePath(`/admin/matchs/${id}/edit`);

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error("Erreur PUT match :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const access = await requireMatchManager();
    if (!access.ok) return access.response;

    const { id } = await params;

    const existingMatch = await prisma.match.findUnique({
      where: { id },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    await prisma.match.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/calendrier");
    revalidatePath("/admin/matchs");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE match :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
