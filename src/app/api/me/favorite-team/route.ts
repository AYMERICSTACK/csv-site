import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      favoriteTeam: {
        select: {
          id: true,
          category: true,
          coach: true,
          group: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    favoriteTeam: user?.favoriteTeam ?? null,
  });
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json();
  const teamId = String(body?.teamId || "").trim();

  if (!teamId) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { favoriteTeamId: null },
    });

    return NextResponse.json({ favoriteTeam: null });
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });

  if (!team) {
    return NextResponse.json({ error: "Équipe introuvable." }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { favoriteTeamId: teamId },
    select: {
      favoriteTeam: {
        select: {
          id: true,
          category: true,
          coach: true,
          group: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    favoriteTeam: user.favoriteTeam,
  });
}
