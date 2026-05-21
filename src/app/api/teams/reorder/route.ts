import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRoleAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return unauthorizedResponse();
    }

    if (!session.user?.email || !(await hasRoleAccess(session.user.email, ["admin", "educateurs"]))) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const teamIds = Array.isArray(body?.teamIds) ? body.teamIds : [];
    const groupId = String(body?.groupId || "").trim();

    if (!groupId || teamIds.length === 0) {
      return NextResponse.json(
        { error: "Données de réorganisation invalides." },
        { status: 400 },
      );
    }

    const teams = await prisma.team.findMany({
      where: {
        groupId,
        id: { in: teamIds },
      },
      select: { id: true },
    });

    if (teams.length !== teamIds.length) {
      return NextResponse.json(
        { error: "Certaines équipes sont introuvables." },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      teamIds.map((teamId: string, index: number) =>
        prisma.team.update({
          where: { id: teamId },
          data: { sortOrder: index + 1 },
        }),
      ),
    );

    revalidatePath("/equipes");
    revalidatePath("/espace-educateurs");
    revalidatePath("/espace-educateurs/equipes");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur reorder teams :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
