import { MATCH_TEAMS } from "@/lib/teams";

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
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Canva peut exporter l’apostrophe typographique avec un caractère de contrôle.
    .replace(/[’‘`´\u0090]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function teamFromLevel(level: string) {
  const clean = normalize(level);

  const explicit = MATCH_TEAMS.find((team) => normalize(team) === clean);
  if (explicit) return explicit;

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
  // Le programme réseaux 2026/27 utilise « Coupe René Tremblay » pour les Seniors 4.
  // On ne la confond surtout pas avec la Coupe René Morandas (Vétérans).
  if (clean.includes("rene tremblay")) return ["other", "Coupe René Tremblay"] as const;
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

const DATE_RE = /^\d{2}\/\d{2}\/\d{4}\s+\d{1,2}h\d{2}$/i;

function looksLikeLevelOrCompetition(value: string) {
  const clean = normalize(value);
  if (teamFromLevel(value)) return true;
  return clean.includes("coupe") || clean === "feminines" || clean.includes("regional") || clean.includes("departemental");
}

function isCsv(value: string) {
  const clean = normalize(value).replace(/\s/g, "");
  return clean.includes("csviriat");
}

function inferredCupTeam(label: string) {
  const clean = normalize(label);
  if (clean.includes("coupe de france")) return "Seniors 1";
  if (clean.includes("rene tremblay")) return "Seniors 4";
  if (clean === "feminines") return "Féminines";
  return "";
}

export function parseProgramTokens(tokens: string[]): ImportedMatchDraft[] {
  const results: ImportedMatchDraft[] = [];
  const consumed = new Set<number>();

  function addDraft(first: string, second: string, date: string, level: string) {
    const firstIsCsv = isCsv(first);
    const secondIsCsv = isCsv(second);
    if (!firstIsCsv && !secondIsCsv) return;

    const inferred = teamFromLevel(level) || inferredCupTeam(level);
    const team = MATCH_TEAMS.includes(inferred as (typeof MATCH_TEAMS)[number]) ? inferred : "";
    const [competitionKey, competitionLabel] = competitionFromLabel(level);

    results.push({
      sourceIndex: results.length,
      category: categoryFromTeam(team),
      team,
      opponent: firstIsCsv ? second : first,
      matchDate: parseFrenchDate(date),
      // Canva expose les deux clubs dans l’ordre inverse de leur position visuelle.
      location: secondIsCsv ? "Stade BRICHON" : "À confirmer",
      isHome: secondIsCsv,
      competitionKey,
      competitionLabel,
      confidence: team ? "high" : "medium",
      warning: team ? undefined : `Équipe non déduite automatiquement depuis « ${level} » : à vérifier.`,
    });
  }

  // Cas simple : club / club / date / catégorie-compétition.
  for (let i = 0; i <= tokens.length - 4; i += 1) {
    if (!DATE_RE.test(tokens[i + 2])) continue;
    if (!looksLikeLevelOrCompetition(tokens[i + 3])) continue;
    if (!isCsv(tokens[i]) && !isCsv(tokens[i + 1])) continue;
    // Les deux premières valeurs doivent bien être des clubs, pas une date ou un libellé
    // décalé provenant d’un groupe de cartes Canva.
    if (DATE_RE.test(tokens[i]) || DATE_RE.test(tokens[i + 1])) continue;
    if (looksLikeLevelOrCompetition(tokens[i]) || looksLikeLevelOrCompetition(tokens[i + 1])) continue;

    addDraft(tokens[i], tokens[i + 1], tokens[i + 2], tokens[i + 3]);
    consumed.add(i); consumed.add(i + 1); consumed.add(i + 2); consumed.add(i + 3);
    i += 3;
  }

  // Canva regroupe parfois plusieurs cartes côte à côte : tous les clubs,
  // puis toutes les dates, puis toutes les catégories. On reconstruit ces lots.
  for (let dateStart = 0; dateStart < tokens.length; dateStart += 1) {
    if (consumed.has(dateStart) || !DATE_RE.test(tokens[dateStart])) continue;

    let dateEnd = dateStart;
    while (dateEnd < tokens.length && !consumed.has(dateEnd) && DATE_RE.test(tokens[dateEnd])) dateEnd += 1;
    const count = dateEnd - dateStart;
    if (count < 2) continue;

    const labelStart = dateEnd;
    const labels = tokens.slice(labelStart, labelStart + count);
    if (labels.length !== count || labels.some((value, offset) => consumed.has(labelStart + offset) || !looksLikeLevelOrCompetition(value))) continue;

    const clubStart = dateStart - 2 * count;
    if (clubStart < 0) continue;
    const clubs = tokens.slice(clubStart, dateStart);
    if (clubs.length !== 2 * count || clubs.some((_, offset) => consumed.has(clubStart + offset))) continue;

    for (let index = 0; index < count; index += 1) {
      const first = clubs[index * 2];
      const second = clubs[index * 2 + 1];
      if (!isCsv(first) && !isCsv(second)) continue;
      addDraft(first, second, tokens[dateStart + index], labels[index]);
    }

    for (let index = clubStart; index < labelStart + count; index += 1) consumed.add(index);
  }

  return results
    .filter((item) => item.matchDate && item.opponent)
    .map((item, index) => ({ ...item, sourceIndex: index }));
}
