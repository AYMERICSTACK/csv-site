export const MATCHDAY_TEAM = "Seniors 2";
export const MATCHDAY_SOURCE = "https://api-dofa.fff.fr/api/compets/454799/phases/1/poules/2/poule_journees";
export const MATCHDAY_SEASON = 2026;

type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue : null;
}
function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
export function parseMatchdays(payload: unknown) {
  const collection = object(payload);
  if (collection?.["@id"] !== MATCHDAY_SOURCE || !Array.isArray(collection["hydra:member"])) {
    throw new Error("Collection FFF inattendue.");
  }
  const members = collection["hydra:member"] as unknown[];
  if (members.length > 60) throw new Error("Trop de journées.");
  return members.map((raw) => {
    const day = object(raw);
    const number = integer(day?.number);
    const date = typeof day?.date === "string" ? new Date(day.date) : new Date(NaN);
    if (!day || number === null || number < 1 || !Number.isFinite(date.getTime()) || !Array.isArray(day.matchs) || day.matchs.length > 30) {
      throw new Error("Journée FFF invalide.");
    }
    const matches = (day.matchs as unknown[]).map((rawMatch) => {
      const match = object(rawMatch);
      const id = integer(match?.ma_no);
      const home = object(match?.home);
      const away = object(match?.away);
      const homeScore = integer(match?.home_score);
      const awayScore = integer(match?.away_score);
      if (!match || id === null || !home || !away) throw new Error("Match FFF invalide.");
      const name = (value: RecordValue) => typeof value.short_name === "string" ? value.short_name.slice(0, 150) : "";
      return {
        id, home: name(home), away: name(away),
        homeScore, awayScore,
        status: typeof match.status === "string" ? match.status : null,
        postponed: typeof match.seems_postponed === "string" ? match.seems_postponed : null,
        homeForfeit: match.home_is_forfeit === "O",
        awayForfeit: match.away_is_forfeit === "O",
      };
    });
    if (new Set(matches.map(match => match.id)).size !== matches.length) throw new Error("Matchs dupliqués.");
    const resultCount = matches.filter(match => match.homeScore !== null && match.awayScore !== null).length;
    return { number, date, matches, totalMatches: matches.length, resultCount,
      complete: matches.length > 0 && resultCount === matches.length };
  });
}
