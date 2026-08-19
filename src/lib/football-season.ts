export const CURRENT_FOOTBALL_SEASON = "2026/2027";

export function getFootballSeasonDateRange(
  season: string = CURRENT_FOOTBALL_SEASON,
) {
  const [startYearRaw, endYearRaw] = season.split("/");
  const startYear = Number(startYearRaw);
  const endYear = Number(endYearRaw);

  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) {
    throw new Error(`Saison de football invalide : ${season}`);
  }

  return {
    start: new Date(Date.UTC(startYear, 6, 1, 0, 0, 0)),
    end: new Date(Date.UTC(endYear, 6, 1, 0, 0, 0)),
  };
}
