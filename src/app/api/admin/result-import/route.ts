import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parsePositionedResults, parseResultTokens } from "@/lib/result-import";
import { revalidatePath } from "next/cache";
import { parseParisDateTime } from "@/lib/paris-datetime";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin", "educateurs"]);
    const data = await request.json();
    if (data.action === "analyze") {
      if (
        (!Array.isArray(data.tokens) && !Array.isArray(data.positioned)) ||
        (Array.isArray(data.tokens) &&
          (data.tokens.length > 3000 ||
            data.tokens.some(
              (v: unknown) => typeof v !== "string" || v.length > 1000,
            ))) ||
        (Array.isArray(data.positioned) &&
          (data.positioned.length > 3000 ||
            data.positioned.some(
              (v: {
                text?: unknown;
                x?: unknown;
                y?: unknown;
                page?: unknown;
              }) =>
                typeof v.text !== "string" ||
                v.text.length > 1000 ||
                !Number.isFinite(v.x) ||
                !Number.isFinite(v.y) ||
                !Number.isInteger(v.page),
            )))
      )
        return NextResponse.json({ error: "PDF invalide." }, { status: 400 });
      const from = new Date(`${data.startDate}T00:00:00+01:00`);
      if (!Number.isFinite(from.getTime()))
        return NextResponse.json({ error: "Date invalide." }, { status: 400 });
      const to = new Date(from.getTime() + 4 * 86400000);
      const matches = await prisma.match.findMany({
        where: { matchDate: { gte: from, lt: to } },
        select: {
          id: true,
          team: true,
          opponent: true,
          matchDate: true,
          status: true,
          scoreTeam: true,
          scoreOpponent: true,
          competitionKey: true,
        },
      });
      const rows = (
        Array.isArray(data.positioned)
          ? parsePositionedResults(data.positioned)
          : parseResultTokens(data.tokens)
      ).map((row) => {
        const candidates = matches.filter(
          (m) => normalize(m.team) === normalize(row.team),
        );
        const matched = candidates.filter(
          (m) =>
            normalize(m.opponent).includes(normalize(row.opponent)) ||
            normalize(row.opponent).includes(normalize(m.opponent)),
        );
        const exact = matched.length === 1 ? matched[0] : null;
        return {
          ...row,
          matchId: exact?.id || "",
          candidates: candidates.map((m) => ({
            id: m.id,
            label: `${m.opponent} · ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(m.matchDate)} · ${m.status}`,
          })),
          warning:
            row.warning ||
            (matched.length !== 1
              ? "Correspondance à confirmer manuellement."
              : undefined),
          selected: exact !== null && exact.status !== "finished",
        };
      });
      return NextResponse.json({ rows });
    }
    if (data.action === "save") {
      if (
        !Array.isArray(data.rows) ||
        data.rows.length > 40 ||
        typeof data.startDate !== "string"
      )
        return NextResponse.json(
          { error: "Sélection invalide." },
          { status: 400 },
        );
      const from = new Date(`${data.startDate}T00:00:00+01:00`);
      if (!Number.isFinite(from.getTime()))
        return NextResponse.json({ error: "Date invalide." }, { status: 400 });
      const to = new Date(from.getTime() + 4 * 86400000);
      type SaveRow = {
        team: string;
        opponent?: string;
        matchId: string;
        createNew?: boolean;
        newDate?: string;
        newTime?: string;
        newIsHome?: boolean;
        status: "finished" | "postponed";
        scoreTeam: number | null;
        scoreOpponent: number | null;
      };
      const rows = data.rows as SaveRow[];
      const existingIds = rows
        .filter((r) => !r.createNew)
        .map((r) => r.matchId);
      if (
        new Set(existingIds).size !== existingIds.length ||
        existingIds.some((id) => typeof id !== "string" || !id)
      )
        return NextResponse.json(
          { error: "Match manquant ou en double." },
          { status: 400 },
        );
      const matches = await prisma.match.findMany({
        where: { id: { in: existingIds }, matchDate: { gte: from, lt: to } },
      });
      if (matches.length !== existingIds.length)
        return NextResponse.json(
          { error: "Un match ne correspond pas au week-end choisi." },
          { status: 400 },
        );
      const planned: { row: SaveRow; date: Date }[] = [];
      const validTeams = new Set([
        "U13 1",
        "U13 2",
        "U13 3",
        "U15 1",
        "U15 2",
        "U20",
        "Seniors 1",
        "Seniors 2",
        "Seniors 3",
        "Seniors 4",
        "Féminines",
        "Vétérans",
      ]);
      for (const row of rows) {
        if (
          !validTeams.has(row.team) ||
          (row.status !== "finished" && row.status !== "postponed")
        )
          return NextResponse.json(
            { error: "Équipe ou statut invalide." },
            { status: 400 },
          );
        if (
          row.status === "finished" &&
          ![row.scoreTeam, row.scoreOpponent].every(
            (v) => Number.isInteger(v) && v !== null && v >= 0 && v <= 99,
          )
        )
          return NextResponse.json(
            { error: "Score invalide." },
            { status: 400 },
          );
        if (row.createNew) {
          if (
            row.matchId ||
            typeof row.opponent !== "string" ||
            !row.opponent.trim() ||
            row.opponent.length > 150 ||
            typeof row.newDate !== "string" ||
            typeof row.newTime !== "string" ||
            typeof row.newIsHome !== "boolean" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(row.newDate) ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(row.newTime)
          )
            return NextResponse.json(
              { error: `Informations incomplètes pour ${row.team}.` },
              { status: 400 },
            );
          const date = parseParisDateTime(`${row.newDate}T${row.newTime}`);
          if (!Number.isFinite(date.getTime()) || date < from || date >= to)
            return NextResponse.json(
              { error: `Date hors week-end pour ${row.team}.` },
              { status: 400 },
            );
          planned.push({ row, date });
        } else {
          const match = matches.find((m) => m.id === row.matchId);
          if (!match || normalize(match.team) !== normalize(row.team))
            return NextResponse.json(
              { error: "Équipe incorrecte." },
              { status: 400 },
            );
          if (match.status === "finished")
            return NextResponse.json(
              {
                error: `Le match ${match.team} contre ${match.opponent} est déjà terminé : modifier sa fiche directement.`,
              },
              { status: 409 },
            );
        }
      }
      await prisma.$transaction(async (tx) => {
        for (const row of rows) {
          if (row.createNew) {
            const date = planned.find((p) => p.row === row)!.date;
            const duplicates = await tx.match.findMany({
              where: { team: row.team, matchDate: { gte: from, lt: to } },
              select: { opponent: true },
            });
            if (
              duplicates.some(
                (m) => normalize(m.opponent) === normalize(row.opponent || ""),
              )
            )
              throw new Error(
                `Un match ${row.team} contre ${row.opponent} existe déjà ce week-end.`,
              );
            await tx.match.create({
              data: {
                category:
                  row.team.startsWith("U13") ||
                  row.team.startsWith("U15") ||
                  row.team === "U20"
                    ? "Formation"
                    : row.team === "Vétérans"
                      ? "Vétérans"
                      : row.team === "Féminines"
                        ? "Féminines"
                        : "Seniors",
                team: row.team,
                opponent: row.opponent!.trim(),
                matchDate: date,
                location: row.newIsHome
                  ? "Domicile (à préciser)"
                  : "Extérieur (à préciser)",
                isHome: row.newIsHome === true,
                status: row.status,
                scoreTeam: row.status === "finished" ? row.scoreTeam : null,
                scoreOpponent:
                  row.status === "finished" ? row.scoreOpponent : null,
              },
            });
          } else {
            await tx.match.update({
              where: { id: row.matchId },
              data: {
                status: row.status,
                scoreTeam: row.status === "finished" ? row.scoreTeam : null,
                scoreOpponent:
                  row.status === "finished" ? row.scoreOpponent : null,
              },
            });
          }
        }
      });
      revalidatePath("/");
      revalidatePath("/calendrier");
      revalidatePath("/admin/matchs");
      return NextResponse.json({ count: data.rows.length });
    }
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (error) {
    console.error("result import", error);
    return NextResponse.json(
      { error: "Import impossible ou accès refusé." },
      { status: 500 },
    );
  }
}
