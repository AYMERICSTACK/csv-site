import { NextResponse } from "next/server";
import { hasCurrentUserRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { extractAccessiblePdfText, parseProgramTokens } from "@/lib/match-import";

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
  if (!access.ok) return NextResponse.json({ error: access.reason === "unauthorized" ? "Non authentifié." : "Accès interdit." }, { status: access.reason === "unauthorized" ? 401 : 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "PDF manquant." }, { status: 400 });
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Pour cette première version, importe un PDF exporté depuis ton visuel." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Le PDF dépasse 10 Mo." }, { status: 400 });

  const tokens = extractAccessiblePdfText(await file.arrayBuffer());
  const drafts = parseProgramTokens(tokens);
  if (!drafts.length) return NextResponse.json({ error: "Je n’ai pas trouvé de rencontres exploitables dans ce PDF. Vérifie qu’il s’agit bien du PDF exporté depuis le visuel (et non d’un scan)." }, { status: 422 });

  const dates = drafts.map((item) => new Date(item.matchDate));
  const minDate = new Date(Math.min(...dates.map((date) => date.getTime())) - 12 * 60 * 60 * 1000);
  const maxDate = new Date(Math.max(...dates.map((date) => date.getTime())) + 12 * 60 * 60 * 1000);
  const existing = await prisma.match.findMany({ where: { matchDate: { gte: minDate, lte: maxDate } }, select: { id: true, team: true, opponent: true, matchDate: true, location: true, isHome: true, competitionKey: true, competitionLabel: true } });

  const matches = drafts.map((draft) => {
    const target = new Date(draft.matchDate).getTime();
    const nearby = existing.filter((item) => Math.abs(item.matchDate.getTime() - target) <= 8 * 60 * 60 * 1000);

    // 1) Correspondance forte : équipe + adversaire (tolère FC, nom long/court, etc.).
    let found = nearby.find((item) => draft.team && item.team === draft.team && opponentSimilarity(item.opponent, draft.opponent) >= 0.75);

    // 2) Même équipe le même jour : une équipe du club ne joue qu’un match officiel par journée.
    if (!found && draft.team) {
      const sameTeam = nearby.filter((item) => item.team === draft.team);
      if (sameTeam.length === 1) found = sameTeam[0];
    }

    // 3) Si le PDF n’a pas permis de déduire l’équipe (ex. certaines Coupes),
    // on peut la récupérer d’un match déjà saisi grâce à l’adversaire et l’horaire.
    if (!found && !draft.team) {
      const opponentMatches = nearby.filter((item) => opponentSimilarity(item.opponent, draft.opponent) >= 0.75);
      if (opponentMatches.length === 1) found = opponentMatches[0];
    }

    if (!found) return { ...draft, existingMatch: null };

    // Pour un doublon, la base reste la source de vérité.
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

  return NextResponse.json({ matches, extractedTokens: tokens.length });
}
