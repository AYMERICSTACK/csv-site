export const MATCHDAY_SEASON = 2026;

export const MATCHDAY_CONFIGS = [
  { team: "Seniors 1", competitionId: 457862, phase: 1, poule: 8, responsibleNames: ["Louis Costa"] },
  { team: "Seniors 2", competitionId: 454799, phase: 1, poule: 2, responsibleNames: ["JOLY Mathieu", "Grenier lilian"] },
  { team: "Seniors 3", competitionId: 454800, phase: 1, poule: 3, responsibleNames: ["Bastien Chanel"] },
  { team: "Seniors 4", competitionId: 454801, phase: 1, poule: 1, responsibleNames: ["Lauris Marguin"] },
  { team: "Féminines", competitionId: 457029, phase: 1, poule: 1, responsibleNames: ["Vanessa Muffat"] },
  { team: "U20", competitionId: 455649, phase: 1, poule: 1, responsibleNames: ["Florian Pelut"] },
  { team: "U17", competitionId: 455651, phase: 1, poule: 3, responsibleNames: ["Gérald Rodak"] },
  { team: "U15 1", competitionId: 455653, phase: 1, poule: 1, responsibleNames: ["Mathis Froment"] },
  { team: "U15 2", competitionId: 455653, phase: 1, poule: 14, responsibleNames: ["Mathis Froment"] },
  { team: "U13 1", competitionId: 457148, phase: 1, poule: 2, responsibleNames: ["Josselin Grefferat"] },
  { team: "U13 2", competitionId: 457148, phase: 1, poule: 5, responsibleNames: ["Josselin Grefferat"] },
  { team: "U13 3", competitionId: 457148, phase: 1, poule: 15, responsibleNames: ["Josselin Grefferat"] },
] as const;

export type MatchdayTeam = (typeof MATCHDAY_CONFIGS)[number]["team"];

export function getMatchdayConfig(team: string) {
  return MATCHDAY_CONFIGS.find((config) => config.team === team) ?? null;
}

export function matchdaySource(config: { competitionId: number; phase: number; poule: number }) {
  return `https://api-dofa.fff.fr/api/compets/${config.competitionId}/phases/${config.phase}/poules/${config.poule}/poule_journees`;
}
