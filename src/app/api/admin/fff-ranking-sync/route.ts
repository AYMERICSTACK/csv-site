import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CLUB_NUMBER = 2218;

const TEAM_CONFIGS = [
  {
    team: "Seniors 1",
    sourceUrl:
      "https://laurafoot.fff.fr/competitions?tab=ranking&id=457862&phase=1&poule=8&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/457862/phases/1/poules/8/classement_journees?page=1",
  },
  {
    team: "Seniors 2",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=454799&phase=1&poule=2&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/454799/phases/1/poules/2/classement_journees?page=1",
  },
  {
    team: "Seniors 3",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=454800&phase=1&poule=3&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/454800/phases/1/poules/3/classement_journees?page=1",
  },
  {
    team: "Seniors 4",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=454801&phase=1&poule=1&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/454801/phases/1/poules/1/classement_journees?page=1",
  },
  {
    team: "Féminines",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=457029&phase=1&poule=1&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/457029/phases/1/poules/1/classement_journees?page=1",
  },
  {
    team: "U20",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=455649&phase=1&poule=1&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/455649/phases/1/poules/1/classement_journees?page=1",
  },
  {
    team: "U17",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=455651&phase=1&poule=3&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/455651/phases/1/poules/3/classement_journees?page=1",
  },
  {
    team: "U15 1",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=455653&phase=1&poule=1&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/455653/phases/1/poules/1/classement_journees?page=1",
  },
  {
    team: "U15 2",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=455653&phase=1&poule=14&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/455653/phases/1/poules/14/classement_journees?page=1",
  },
  {
    team: "U13 1",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=457148&phase=1&poule=2&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/457148/phases/1/poules/2/classement_journees?page=1",
  },
  {
    team: "U13 2",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=457148&phase=1&poule=5&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/457148/phases/1/poules/5/classement_journees?page=1",
  },
  {
    team: "U13 3",
    sourceUrl:
      "https://ain.fff.fr/competitions?tab=ranking&id=457148&phase=1&poule=15&type=ch",
    dofaUrl:
      "https://api-dofa.fff.fr/api/compets/457148/phases/1/poules/15/classement_journees?page=1",
  },
] as const;

const ALLOWED_TEAMS = new Set(TEAM_CONFIGS.map((config) => config.team));

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

  return NextResponse.json({ teams: TEAM_CONFIGS });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const team = typeof body?.team === "string" ? body.team.trim() : "";
  const dofaPayload = body?.dofaPayload;

  if (!ALLOWED_TEAMS.has(team as (typeof TEAM_CONFIGS)[number]["team"])) {
    return NextResponse.json({ error: "Équipe invalide." }, { status: 400 });
  }

  const config = TEAM_CONFIGS.find((item) => item.team === team);

  if (!config) {
    return NextResponse.json({ error: "Configuration introuvable." }, { status: 400 });
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

  await prisma.$transaction([
    prisma.teamSetting.upsert({
      where: { team },
      update: { fffUrl: config.sourceUrl },
      create: { team, fffUrl: config.sourceUrl },
    }),
    prisma.fffRankingSnapshot.upsert({
      where: { sourceUrl: config.sourceUrl },
      update: {
        rows: preview.rows as unknown as Prisma.InputJsonValue,
        found: true,
        fetchedAt: now,
        lastSuccessAt: now,
        lastError: null,
      },
      create: {
        sourceUrl: config.sourceUrl,
        rows: preview.rows as unknown as Prisma.InputJsonValue,
        found: true,
        fetchedAt: now,
        lastSuccessAt: now,
        lastError: null,
      },
    }),
  ]);

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
