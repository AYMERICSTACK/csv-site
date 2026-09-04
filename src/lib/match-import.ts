import { CLUB_TEAMS } from "@/lib/teams";

export type ImportedMatchDraft = {
  sourceIndex: number;
  category: string;
  team: string;
  opponent: string;
  matchDate: string;
  location: string;
  isHome: boolean;
  competitionKey: string;
  competitionLabel: string;
  confidence: "high" | "medium" | "low";
  warning?: string;
};

function decodePdfLiteral(value: string) {
  return value
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\\\/g, "\\")
    .trim();
}

function decodeHex(value: string) {
  const bytes = value.match(/.{1,2}/g)?.map((part) => parseInt(part, 16)) ?? [];
  return new TextDecoder("windows-1252").decode(new Uint8Array(bytes)).trim();
}

export function extractAccessiblePdfText(buffer: ArrayBuffer) {
  const raw = new TextDecoder("latin1").decode(new Uint8Array(buffer));
  const values: string[] = [];
  const regex = /\/E\s*(?:\(((?:\\.|[^\\)])*)\)|<([0-9A-Fa-f]+)>)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw))) {
    const value = match[1] !== undefined ? decodePdfLiteral(match[1]) : decodeHex(match[2]);
    if (value) values.push(value);
  }
  return values;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function teamFromLevel(level: string) {
  const clean = normalize(level);
  const rules: Array<[RegExp, string]> = [
    [/^(regional|r)\s*3$/, "Seniors 1"],
    [/^(departemental|d)\s*2$/, "Seniors 2"],
    [/^(departemental|d)\s*3$/, "Seniors 3"],
    [/^(departemental|d)\s*4$/, "Seniors 4"],
  ];
  return rules.find(([pattern]) => pattern.test(clean))?.[1] ?? "";
}

function categoryFromTeam(team: string) {
  if (team.startsWith("Seniors")) return "Seniors";
  if (team.startsWith("U15")) return "U15";
  if (team.startsWith("U13")) return "U13";
  return team;
}

function competitionFromLabel(label: string) {
  const clean = normalize(label);
  if (clean.includes("coupe de france")) return ["coupe-france", "Coupe de France"] as const;
  if (clean.includes("laura")) return ["coupe-laurafoot", "Coupe LAuRAFoot"] as const;
  if (clean.includes("coupe de l'ain") || clean.includes("coupe de l ain")) return ["coupe-ain", "Coupe de l'Ain"] as const;
  if (clean.includes("morandas")) return ["coupe-rene-morandas", "Coupe René Morandas"] as const;
  if (clean.includes("peggy provost")) return ["coupe-peggy-provost", "Coupe Peggy Provost"] as const;
  if (clean.includes("gambardella")) return ["coupe-gambardella", "Coupe Gambardella"] as const;
  if (clean.includes("amical")) return ["friendly", "Match amical"] as const;
  return ["championship", "Championnat"] as const;
}

function parseFrenchDate(value: string) {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2})h(\d{2})/i);
  if (!match) return "";
  const [, day, month, year, hour, minute] = match;
  return `${year}-${month}-${day}T${hour.padStart(2, "0")}:${minute}`;
}

export function parseProgramTokens(tokens: string[]): ImportedMatchDraft[] {
  const results: ImportedMatchDraft[] = [];
  for (let i = 0; i <= tokens.length - 4; i += 1) {
    const first = tokens[i];
    const second = tokens[i + 1];
    const date = tokens[i + 2];
    const level = tokens[i + 3];
    if (!/^\d{2}\/\d{2}\/\d{4}\s+\d{1,2}h\d{2}$/i.test(date)) continue;
    const firstIsCsv = normalize(first).includes("cs viriat") || normalize(first).includes("csviriat");
    const secondIsCsv = normalize(second).includes("cs viriat") || normalize(second).includes("csviriat");
    if (!firstIsCsv && !secondIsCsv) continue;

    const inferredTeam = teamFromLevel(level);
    const team = CLUB_TEAMS.includes(inferredTeam as (typeof CLUB_TEAMS)[number]) ? inferredTeam : "";
    const [competitionKey, competitionLabel] = competitionFromLabel(level);
    results.push({
      sourceIndex: results.length,
      category: categoryFromTeam(team),
      team,
      opponent: firstIsCsv ? second : first,
      matchDate: parseFrenchDate(date),
      // Les PDF Canva utilisés pour les visuels exposent les deux clubs dans
      // l’ordre inverse de leur position visuelle : le premier token correspond
      // à la colonne de droite et le second à la colonne de gauche.
      // CS Viriat à gauche = domicile ; CS Viriat à droite = extérieur.
      location: secondIsCsv ? "Stade BRICHON" : "À confirmer",
      isHome: secondIsCsv,
      competitionKey,
      competitionLabel,
      confidence: team ? "high" : "medium",
      warning: team ? undefined : `Équipe non déduite automatiquement depuis « ${level} » : à vérifier.`,
    });
    i += 3;
  }
  return results;
}
