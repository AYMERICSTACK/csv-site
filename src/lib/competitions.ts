export type CompetitionType = "league" | "cup" | "friendly" | "other";

export type CompetitionDefinition = {
  key: string;
  label: string;
  type: CompetitionType;
  teams: readonly string[] | "all";
  knockout: boolean;
  penalties: boolean;
};

export const COMPETITIONS: readonly CompetitionDefinition[] = [
  {
    key: "championship",
    label: "Championnat",
    type: "league",
    teams: "all",
    knockout: false,
    penalties: false,
  },
  {
    key: "coupe-france",
    label: "Coupe de France",
    type: "cup",
    teams: ["Seniors 1"],
    knockout: true,
    penalties: true,
  },
  {
    key: "coupe-laurafoot",
    label: "Coupe LAuRAFoot",
    type: "cup",
    teams: ["Seniors 1"],
    knockout: true,
    penalties: true,
  },
  {
    key: "coupe-ain",
    label: "Coupe de l'Ain",
    type: "cup",
    teams: ["Seniors 2"],
    knockout: true,
    penalties: true,
  },
  {
    key: "coupe-rene-morandas",
    label: "Coupe René Morandas",
    type: "cup",
    teams: ["Vétérans"],
    knockout: true,
    penalties: true,
  },
  {
    key: "coupe-peggy-provost",
    label: "Coupe Peggy Provost",
    type: "cup",
    teams: ["Féminines"],
    knockout: true,
    penalties: true,
  },
  {
    key: "coupe-gambardella",
    label: "Coupe Gambardella",
    type: "cup",
    teams: ["U20", "U17"],
    knockout: true,
    penalties: true,
  },
  {
    key: "friendly",
    label: "Match amical",
    type: "friendly",
    teams: "all",
    knockout: false,
    penalties: false,
  },
  {
    key: "other",
    label: "Autre",
    type: "other",
    teams: "all",
    knockout: false,
    penalties: false,
  },
] as const;

export function getCompetitionDefinition(key: string | null | undefined) {
  return COMPETITIONS.find((competition) => competition.key === key) ?? null;
}

export function getCompetitionsForTeam(
  team: string,
  eliminatedKeys: readonly string[] = [],
) {
  return COMPETITIONS.filter((competition) => {
    const eligible =
      competition.teams === "all" || competition.teams.includes(team);

    if (!eligible) return false;
    if (!competition.knockout) return true;

    return !eliminatedKeys.includes(competition.key);
  });
}

export function isKnockoutCompetition(key: string | null | undefined) {
  return Boolean(getCompetitionDefinition(key)?.knockout);
}

export function competitionAllowsPenalties(key: string | null | undefined) {
  return Boolean(getCompetitionDefinition(key)?.penalties);
}

export function getCompetitionLabel(
  key: string | null | undefined,
  customLabel?: string | null,
) {
  if (key === "other" && customLabel?.trim()) return customLabel.trim();
  return getCompetitionDefinition(key)?.label ?? customLabel?.trim() ?? "Championnat";
}

export type CompetitionMatchResult = {
  team: string;
  competitionKey: string;
  status: string;
  scoreTeam: number | null;
  scoreOpponent: number | null;
  penaltyScoreTeam?: number | null;
  penaltyScoreOpponent?: number | null;
};

export function didTeamLoseKnockoutMatch(match: CompetitionMatchResult) {
  if (match.status !== "finished") return false;
  if (!isKnockoutCompetition(match.competitionKey)) return false;
  if (match.scoreTeam === null || match.scoreOpponent === null) return false;

  if (match.scoreTeam < match.scoreOpponent) return true;
  if (match.scoreTeam > match.scoreOpponent) return false;

  if (
    match.penaltyScoreTeam !== null &&
    typeof match.penaltyScoreTeam !== "undefined" &&
    match.penaltyScoreOpponent !== null &&
    typeof match.penaltyScoreOpponent !== "undefined"
  ) {
    return match.penaltyScoreTeam < match.penaltyScoreOpponent;
  }

  return false;
}

export function getEliminatedCompetitionKeys(
  team: string,
  matches: readonly CompetitionMatchResult[],
) {
  return Array.from(
    new Set(
      matches
        .filter((match) => match.team === team && didTeamLoseKnockoutMatch(match))
        .map((match) => match.competitionKey),
    ),
  );
}
