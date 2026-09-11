import { NextResponse } from "next/server";
import { hasCurrentUserRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseParisDateTime } from "@/lib/paris-datetime";
import { SCHOOL_FOOT_TEAMS, normalizeTeamName } from "@/lib/teams";

async function getOrCreateSchoolTeam(teamName: string) {
  const normalized = normalizeTeamName(teamName);
  const teams = await prisma.team.findMany({ select: { id: true, category: true } });
  const existing = teams.find((team) => normalizeTeamName(team.category) === normalized);
  if (existing) return existing.id;

  let group = await prisma.teamGroup.findFirst({
    where: { title: { equals: "École de foot", mode: "insensitive" } },
    select: { id: true },
  });
  if (!group) {
    group = await prisma.teamGroup.create({
      data: { title: "École de foot", subtitle: "U7, U9 et U11", badge: "École de foot", sortOrder: 30, isPublished: true },
      select: { id: true },
    });
  }

  const created = await prisma.team.create({
    data: { category: teamName, coach: "À renseigner", groupId: group.id, isPublished: true },
    select: { id: true },
  });
  return created.id;
}

export async function POST(request: Request) {
  const access = await hasCurrentUserRole(["admin", "educateurs"]);
  if (!access.ok) {
    return NextResponse.json({ error: "Accès interdit." }, { status: access.reason === "unauthorized" ? 401 : 403 });
  }

  const body = await request.json().catch(() => null) as null | {
    team?: string;
    eventDate?: string;
    location?: string;
    title?: string;
    format?: string;
    participants?: string[];
    opponents?: string[];
  };

  const team = String(body?.team || "").trim();
  const eventDateRaw = String(body?.eventDate || "").trim();
  const location = String(body?.location || "").trim();
  const format = body?.format === "festival" ? "festival" : "matches";
  const participants = Array.isArray(body?.participants) ? body!.participants.map(String).map((value) => value.trim()).filter(Boolean) : [];
  const opponents = Array.isArray(body?.opponents) ? body!.opponents.map(String).map((value) => value.trim()).filter(Boolean) : [];

  if (!SCHOOL_FOOT_TEAMS.includes(team as (typeof SCHOOL_FOOT_TEAMS)[number])) {
    return NextResponse.json({ error: "Équipe école de foot invalide." }, { status: 400 });
  }
  if (!eventDateRaw || !location) return NextResponse.json({ error: "Date et lieu obligatoires." }, { status: 400 });

  const teamId = await getOrCreateSchoolTeam(team);
  const eventDate = parseParisDateTime(eventDateRaw);

  const duplicate = await prisma.plateau.findFirst({
    where: {
      teamId,
      eventDate: {
        gte: new Date(eventDate.getTime() - 4 * 60 * 60 * 1000),
        lte: new Date(eventDate.getTime() + 4 * 60 * 60 * 1000),
      },
    },
    select: { id: true },
  });
  if (duplicate) return NextResponse.json({ error: "Ce plateau semble déjà enregistré." }, { status: 409 });

  const plateau = await prisma.plateau.create({
    data: {
      teamId,
      title: String(body?.title || "").trim() || null,
      eventDate,
      location,
      format,
      status: "scheduled",
      participants: { create: participants.map((name, index) => ({ name, sortOrder: index })) },
      games: {
        create: opponents.map((opponent, index) => ({ opponent, scheduledAt: eventDate, sortOrder: index })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: plateau.id });
}
