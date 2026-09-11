export const MATCH_TEAMS = [
  "Seniors 1",
  "Seniors 2",
  "Seniors 3",
  "Seniors 4",

  "Féminines",
  "Vétérans",

  "U20",

  "U17",

  "U15 1",
  "U15 2",

  "U13 1",
  "U13 2",
  "U13 3",
] as const;

export const SCHOOL_FOOT_TEAMS = [
  "U7",
  "U9",
  "U11 1",
  "U11 2",
  "U11 3",
  "U11 4",
] as const;

export const CLUB_TEAMS = [...MATCH_TEAMS, ...SCHOOL_FOOT_TEAMS] as const;

export type MatchTeam = (typeof MATCH_TEAMS)[number];
export type SchoolFootTeam = (typeof SCHOOL_FOOT_TEAMS)[number];
export type ClubTeam = (typeof CLUB_TEAMS)[number];

export function normalizeTeamName(team: string | null | undefined) {
  const cleaned = String(team || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  if (!cleaned) return "";

  const lower = cleaned.toLowerCase();

  if (/^seniors?\s*1$/.test(lower)) return "Seniors 1";
  if (/^seniors?\s*2$/.test(lower)) return "Seniors 2";
  if (/^seniors?\s*3$/.test(lower)) return "Seniors 3";
  if (/^seniors?\s*4$/.test(lower)) return "Seniors 4";

  if (lower === "feminines" || lower === "feminine") return "Féminines";
  if (lower === "veterans" || lower === "veteran") return "Vétérans";

  if (lower === "u20") return "U20";
  if (lower === "u13") return "U13";
  if (lower === "u11") return "U11";
  if (lower === "u9") return "U9";
  if (lower === "u7") return "U7";

  return cleaned;
}

export function slugifyTeam(team: string) {
  return normalizeTeamName(team)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
