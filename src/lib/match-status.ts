export function isFilledScore(value: string | null | undefined) {
  return typeof value === "string" && value.trim() !== "";
}

export function hasOnlyOneScoreFilled(
  scoreTeam: string | null | undefined,
  scoreOpponent: string | null | undefined,
) {
  return isFilledScore(scoreTeam) !== isFilledScore(scoreOpponent);
}

export function normalizeMatchStatus(
  status: string,
  scoreTeam: string | null | undefined,
  scoreOpponent: string | null | undefined,
) {
  if (status === "cancelled" || status === "postponed") {
    return status;
  }

  const hasScore = isFilledScore(scoreTeam) && isFilledScore(scoreOpponent);

  if (hasScore) {
    return "finished";
  }

  if (status === "finished") {
    return "scheduled";
  }

  return status;
}
