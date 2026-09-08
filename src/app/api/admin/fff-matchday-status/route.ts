import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getRankingAccess } from "@/lib/fff-ranking-access";
import { prisma } from "@/lib/prisma";
import { MATCHDAY_TEAM, MATCHDAY_SOURCE, MATCHDAY_SEASON, parseMatchdays } from "@/lib/fff-matchday";

export const dynamic = "force-dynamic";
async function allowed() {
  const access = await getRankingAccess();
  return Boolean(access && (access.isAdmin || access.teams?.includes(MATCHDAY_TEAM)));
}
export async function GET() {
  if (!(await allowed())) return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  const rows = await prisma.fffMatchdaySnapshot.findMany({
    where: { sourceUrl: MATCHDAY_SOURCE, season: MATCHDAY_SEASON },
    orderBy: { dayNumber: "desc" }, take: 30,
  });
  return NextResponse.json({ days: rows });
}
export async function POST(request: Request) {
  if (!(await allowed())) return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (body?.team !== MATCHDAY_TEAM) return NextResponse.json({ error: "Équipe invalide." }, { status: 400 });
  let days: ReturnType<typeof parseMatchdays>;
  try { days = parseMatchdays(body.dofaPayload); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Données invalides." }, { status: 400 }); }
  if (new Set(days.map(day => day.number)).size !== days.length) {
    return NextResponse.json({ error: "Journées dupliquées." }, { status: 400 });
  }
  const now = new Date();
  const past = days.filter(day => day.date.getTime() <= now.getTime());
  const saved = [];
  for (const day of past) {
    const data = {
      team: MATCHDAY_TEAM, competitionId: 454799, phase: 1, poule: 2,
      dayDate: day.date, totalMatches: day.totalMatches, resultCount: day.resultCount,
      complete: day.complete, matches: day.matches as unknown as Prisma.InputJsonValue,
      checkedAt: now,
    };
    const row = await prisma.fffMatchdaySnapshot.upsert({
      where: { sourceUrl_season_dayNumber: { sourceUrl: MATCHDAY_SOURCE, season: MATCHDAY_SEASON, dayNumber: day.number } },
      create: { ...data, sourceUrl: MATCHDAY_SOURCE, season: MATCHDAY_SEASON, dayNumber: day.number,
        completedAt: day.complete ? now : null },
      update: data,
    });
    const finalRow = day.complete && !row.completedAt
      ? await prisma.fffMatchdaySnapshot.update({ where: { id: row.id }, data: { completedAt: now } })
      : row;
    saved.push(finalRow);
  }
  return NextResponse.json({ days: saved.sort((a,b) => b.dayNumber-a.dayNumber) });
}
