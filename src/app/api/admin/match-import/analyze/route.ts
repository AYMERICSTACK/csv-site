import { NextResponse } from "next/server";
import { hasCurrentUserRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { extractAccessiblePdfText, parseProgramTokens } from "@/lib/match-import";

function norm(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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
    const found = existing.find((item) => item.team === draft.team && norm(item.opponent) === norm(draft.opponent) && Math.abs(item.matchDate.getTime() - target) <= 6 * 60 * 60 * 1000);
    if (!found) return { ...draft, existingMatch: null };

    // Pour un doublon, la base reste la source de vérité : on affiche les
    // informations déjà enregistrées au lieu des valeurs déduites du PDF.
    return {
      ...draft,
      location: found.location,
      isHome: found.isHome,
      competitionKey: found.competitionKey,
      competitionLabel: found.competitionLabel,
      existingMatch: { ...found, matchDate: found.matchDate.toISOString() },
    };
  });

  return NextResponse.json({ matches, extractedTokens: tokens.length });
}
