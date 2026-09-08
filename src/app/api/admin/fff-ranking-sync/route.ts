import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TEAMS = new Set([
  "Seniors 1",
  "Seniors 2",
  "Seniors 3",
  "Seniors 4",
]);

const CLUB_NUMBER = 2218;

type DofaMember = {
  rank?: unknown;
  point_count?: unknown;
  equipe?: {
    club?: { cl_no?: unknown };
    short_name?: unknown;
    code?: unknown;
  };
};

type RankingPreviewRow = {
  rank: number;
  team: string;
  points: number | null;
  isClub: boolean;
};

function isAllowedFffSource(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "epreuves.fff.fr";
  } catch {
    return false;
  }
}

function toFiniteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatTeamName(member: DofaMember) {
  const rawName =
    typeof member.equipe?.short_name === "string"
      ? member.equipe.short_name.trim()
      : "";
  const code = toFiniteNumber(member.equipe?.code);

  if (!rawName) return "";
  if (code && code > 1) return `${rawName} ${code}`;
  return rawName;
}

function isViriat(member: DofaMember, teamName: string) {
  const clubNo = toFiniteNumber(member.equipe?.club?.cl_no);
  return clubNo === CLUB_NUMBER || /\bVIRIAT\b/i.test(teamName);
}

function buildPreview(members: DofaMember[]) {
  const rows = members
    .map((member): RankingPreviewRow | null => {
      const rank = toFiniteNumber(member.rank);
      const team = formatTeamName(member);
      const points = toFiniteNumber(member.point_count);

      if (!rank || !team) return null;

      return {
        rank,
        team,
        points,
        isClub: isViriat(member, team),
      };
    })
    .filter((row): row is RankingPreviewRow => Boolean(row))
    .sort((a, b) => a.rank - b.rank);

  const clubIndex = rows.findIndex((row) => row.isClub);

  if (clubIndex === -1) {
    return { found: false, rows: rows.slice(0, 4), totalRows: rows.length };
  }

  const start = Math.max(
    0,
    Math.min(clubIndex - 2, Math.max(rows.length - 4, 0)),
  );

  return {
    found: true,
    rows: rows.slice(start, start + 4),
    totalRows: rows.length,
  };
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  return user?.role === "admin" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  }

  const settings = await prisma.teamSetting.findMany({
    where: { team: { in: Array.from(ALLOWED_TEAMS) } },
    select: { team: true, fffUrl: true },
  });

  return NextResponse.json({
    teams: Array.from(ALLOWED_TEAMS).map((team) => ({
      team,
      sourceUrl: settings.find((setting) => setting.team === team)?.fffUrl ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const team = typeof body?.team === "string" ? body.team.trim() : "";
  const sourceUrl =
    typeof body?.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const dofaPayload = body?.dofaPayload;

  if (!ALLOWED_TEAMS.has(team)) {
    return NextResponse.json({ error: "Équipe invalide." }, { status: 400 });
  }

  if (!isAllowedFffSource(sourceUrl)) {
    return NextResponse.json(
      { error: "URL FFF source invalide." },
      { status: 400 },
    );
  }

  const members = Array.isArray(dofaPayload?.["hydra:member"])
    ? (dofaPayload["hydra:member"] as DofaMember[])
    : [];

  if (!members.length) {
    return NextResponse.json(
      { error: "Aucune ligne de classement reçue depuis DOFA." },
      { status: 400 },
    );
  }

  const preview = buildPreview(members);

  if (!preview.found) {
    return NextResponse.json(
      { error: "Le CS Viriat n’a pas été trouvé dans ce classement." },
      { status: 400 },
    );
  }

  const now = new Date();

  await prisma.fffRankingSnapshot.upsert({
    where: { sourceUrl },
    update: {
      rows: preview.rows as unknown as Prisma.InputJsonValue,
      found: true,
      fetchedAt: now,
      lastSuccessAt: now,
      lastError: null,
    },
    create: {
      sourceUrl,
      rows: preview.rows as unknown as Prisma.InputJsonValue,
      found: true,
      fetchedAt: now,
      lastSuccessAt: now,
      lastError: null,
    },
  });

  const clubRow = preview.rows.find((row) => row.isClub) ?? null;

  return NextResponse.json({
    success: true,
    team,
    totalRows: preview.totalRows,
    rank: clubRow?.rank ?? null,
    points: clubRow?.points ?? null,
    updatedAt: now.toISOString(),
  });
}
