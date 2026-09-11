import { NextResponse } from "next/server";
import { hasCurrentUserRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  extractAccessiblePdfText,
  parseProgramTokens,
  parseSchoolFootPlateaux,
} from "@/lib/match-import";

function norm(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function opponentSimilarity(a: string, b: string) {
  const left = norm(a);
  const right = norm(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;

  const leftWords = new Set(left.split(" ").filter((word) => word.length > 2));
  const rightWords = new Set(right.split(" ").filter((word) => word.length > 2));
  if (!leftWords.size || !rightWords.size) return 0;
  const common = [...leftWords].filter((word) => rightWords.has(word)).length;
  return common / Math.min(leftWords.size, rightWords.size);
}

export async function POST(request: Request) {
  const access = await hasCurrentUserRole(["admin", "educateurs"]);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.reason === "unauthorized" ? "Non authentifié." : "Accès interdit." },
      { status: access.reason === "unauthorized" ? 401 : 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "PDF manquant." }, { status: 400 });
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Importe un PDF exporté depuis le visuel du programme." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Le PDF dépasse 10 Mo." }, { status: 400 });

  const tokens = extractAccessiblePdfText(await file.arrayBuffer());
  const drafts = parseProgramTokens(tokens);
  const plateauDrafts = parseSchoolFootPlateaux(tokens);

  if (!drafts.length && !plateauDrafts.length) {
    return NextResponse.json(
      { error: "Je n’ai trouvé ni match ni plateau exploitable dans ce PDF. Vérifie qu’il s’agit bien du PDF exporté depuis le visuel." },
      { status: 422 },
    );
  }

  let matches: Array<Record<string, unknown>> = [];
  if (drafts.length) {
    const dates = drafts.map((item) => new Date(item.matchDate));
    const minDate = new Date(Math.min(...dates.map((date) => date.getTime())) - 12 * 60 * 60 * 1000);
    const maxDate = new Date(Math.max(...dates.map((date) => date.getTime())) + 12 * 60 * 60 * 1000);
    const existing = await prisma.match.findMany({
      where: { matchDate: { gte: minDate, lte: maxDate } },
      select: { id: true, team: true, opponent: true, matchDate: true, location: true, isHome: true, competitionKey: true, competitionLabel: true },
    });

    matches = drafts.map((draft) => {
      const target = new Date(draft.matchDate).getTime();
      const nearby = existing.filter((item) => Math.abs(item.matchDate.getTime() - target) <= 8 * 60 * 60 * 1000);
      let found = nearby.find((item) => draft.team && item.team === draft.team && opponentSimilarity(item.opponent, draft.opponent) >= 0.75);

      if (!found && draft.team) {
        const sameTeam = nearby.filter((item) => item.team === draft.team);
        if (sameTeam.length === 1) found = sameTeam[0];
      }

      if (!found && !draft.team) {
        const opponentMatches = nearby.filter((item) => opponentSimilarity(item.opponent, draft.opponent) >= 0.75);
        if (opponentMatches.length === 1) found = opponentMatches[0];
      }

      if (!found) return { ...draft, existingMatch: null };

      return {
        ...draft,
        team: found.team,
        category: found.team.startsWith("Seniors") ? "Seniors" : found.team.startsWith("U15") ? "U15" : found.team.startsWith("U13") ? "U13" : found.team,
        opponent: found.opponent,
        matchDate: found.matchDate.toISOString().slice(0, 16),
        location: found.location,
        isHome: found.isHome,
        competitionKey: found.competitionKey,
        competitionLabel: found.competitionLabel,
        warning: undefined,
        existingMatch: { ...found, matchDate: found.matchDate.toISOString() },
      };
    });
  }

  let plateaux: Array<Record<string, unknown>> = [];
  if (plateauDrafts.length) {
    const dates = plateauDrafts.map((item) => new Date(item.eventDate));
    const minDate = new Date(Math.min(...dates.map((date) => date.getTime())) - 8 * 60 * 60 * 1000);
    const maxDate = new Date(Math.max(...dates.map((date) => date.getTime())) + 8 * 60 * 60 * 1000);
    const existing = await prisma.plateau.findMany({
      where: { eventDate: { gte: minDate, lte: maxDate } },
      select: {
        id: true,
        eventDate: true,
        location: true,
        format: true,
        title: true,
        team: { select: { category: true } },
        participants: { select: { name: true }, orderBy: { sortOrder: "asc" } },
        games: { select: { opponent: true }, orderBy: { sortOrder: "asc" } },
      },
    });

    plateaux = plateauDrafts.map((draft) => {
      const target = new Date(draft.eventDate).getTime();
      const found = existing.find(
        (item) => item.team.category === draft.team && Math.abs(item.eventDate.getTime() - target) <= 4 * 60 * 60 * 1000,
      );

      if (!found) return { ...draft, existingPlateau: null };
      return {
        ...draft,
        eventDate: found.eventDate.toISOString().slice(0, 16),
        location: found.location,
        format: found.format,
        title: found.title || draft.title,
        participants: found.participants.map((item) => item.name),
        opponents: found.games.map((item) => item.opponent),
        warning: undefined,
        existingPlateau: { id: found.id, eventDate: found.eventDate.toISOString() },
      };
    });
  }

  return NextResponse.json({ matches, plateaux, extractedTokens: tokens.length });
}
