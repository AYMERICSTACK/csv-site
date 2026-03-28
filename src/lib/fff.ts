import { prisma } from "@/lib/prisma";

const FFF_SENIOR_1 = {
  clubName: "C.S. VIRIAT",
  teamLabel: "Senior 1",
  category: "Seniors",
  competitionName: "SENIORS REGIONAL 3",
  cpNo: 443530,
  phNo: 1,
  gpNo: 7,
};

type RawFffTeam = {
  name?: string;
  shortName?: string;
  libelle?: string;
};

type RawFffMatch = {
  id?: string | number;
  matchId?: string | number;
  no?: string | number;

  date?: string;
  dateMatch?: string;
  matchDate?: string;
  datetime?: string;

  status?: string;
  statut?: string;
  statusLabel?: string;

  homeTeam?: RawFffTeam | string;
  awayTeam?: RawFffTeam | string;
  equipeRecevante?: RawFffTeam | string;
  equipeVisiteuse?: RawFffTeam | string;
  teamHome?: RawFffTeam | string;
  teamAway?: RawFffTeam | string;

  homeScore?: number | string | null;
  awayScore?: number | string | null;
  scoreHome?: number | string | null;
  scoreAway?: number | string | null;
  goalsHome?: number | string | null;
  goalsAway?: number | string | null;

  location?: string;
  lieu?: string;
  stadium?: string;
  terrain?: string;

  competition?: { name?: string } | string;
  phase?: { name?: string } | string;
  group?: { name?: string } | string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function getTeamName(team: RawFffTeam | string | undefined) {
  if (!team) return "";
  if (typeof team === "string") return team.trim();

  return String(team.name || team.shortName || team.libelle || "").trim();
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapStatus(
  rawStatus: unknown,
  scoreTeam: number | null,
  scoreOpponent: number | null,
) {
  const s = String(rawStatus || "")
    .trim()
    .toLowerCase();

  if (
    s.includes("reporte") ||
    s.includes("reporté") ||
    s.includes("postpone")
  ) {
    return "postponed";
  }

  if (s.includes("annul")) {
    return "cancelled";
  }

  if (
    s.includes("term") ||
    s.includes("final") ||
    s.includes("joue") ||
    s.includes("played") ||
    s.includes("clos")
  ) {
    return "finished";
  }

  if (scoreTeam !== null && scoreOpponent !== null) {
    return "finished";
  }

  return "scheduled";
}

function buildSeasonRange() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  return {
    start: `${year}-08-01T00:00:00+00:00`,
    end: `${year + 1}-06-30T23:59:59+00:00`,
  };
}

function parseRawMatches(payload: unknown): RawFffMatch[] {
  if (Array.isArray(payload)) return payload as RawFffMatch[];

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    if (Array.isArray(obj["hydra:member"])) {
      return obj["hydra:member"] as RawFffMatch[];
    }

    if (Array.isArray(obj.items)) {
      return obj.items as RawFffMatch[];
    }

    if (Array.isArray(obj.matches)) {
      return obj.matches as RawFffMatch[];
    }

    if (Array.isArray(obj.data)) {
      return obj.data as RawFffMatch[];
    }
  }

  return [];
}

function normalizeMatch(raw: RawFffMatch) {
  const home = getTeamName(raw.homeTeam || raw.equipeRecevante || raw.teamHome);
  const away = getTeamName(raw.awayTeam || raw.equipeVisiteuse || raw.teamAway);

  const homeScore = toNullableNumber(
    raw.homeScore ?? raw.scoreHome ?? raw.goalsHome,
  );
  const awayScore = toNullableNumber(
    raw.awayScore ?? raw.scoreAway ?? raw.goalsAway,
  );

  const clubNormalized = normalizeText(FFF_SENIOR_1.clubName);
  const isHome = normalizeText(home) === clubNormalized;
  const isAway = normalizeText(away) === clubNormalized;

  if (!isHome && !isAway) {
    return null;
  }

  const team = FFF_SENIOR_1.teamLabel;
  const opponent = isHome ? away : home;

  if (!opponent) {
    return null;
  }

  const matchDate = String(
    raw.date || raw.dateMatch || raw.matchDate || raw.datetime || "",
  ).trim();

  if (!matchDate) {
    return null;
  }

  const scoreTeam = isHome ? homeScore : awayScore;
  const scoreOpponent = isHome ? awayScore : homeScore;

  const rawStatus = raw.status || raw.statut || raw.statusLabel;

  return {
    category: FFF_SENIOR_1.category,
    team,
    opponent,
    matchDate: new Date(matchDate),
    location: String(
      raw.location || raw.lieu || raw.stadium || raw.terrain || "À confirmer",
    ).trim(),
    isHome,
    status: mapStatus(rawStatus, scoreTeam, scoreOpponent),
    scoreTeam,
    scoreOpponent,
  };
}

export async function importSenior1FromFFF() {
  const { start, end } = buildSeasonRange();

  const url = new URL("https://epreuves.fff.fr/api/matches");
  url.searchParams.set("cpNo", String(FFF_SENIOR_1.cpNo));
  url.searchParams.set("phNo", String(FFF_SENIOR_1.phNo));
  url.searchParams.set("gpNo", String(FFF_SENIOR_1.gpNo));
  url.searchParams.set("dateDebut", start);
  url.searchParams.set("dateFin", end);
  url.searchParams.set("itemsPerPage", "300");
  url.searchParams.set("pagination", "true");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  console.log("FFF status:", response.status);
  console.log("FFF content-type:", contentType);
  console.log("FFF response preview:", rawText.slice(0, 500));

  if (!response.ok) {
    throw new Error(
      `FFF import failed (${response.status}) : ${rawText.slice(0, 200)}`,
    );
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `FFF n'a pas renvoyé du JSON. Content-Type reçu : ${contentType}`,
    );
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Réponse FFF non JSON. Début de réponse : ${rawText.slice(0, 200)}`,
    );
  }

  const rawMatches = parseRawMatches(payload);
  console.log("FFF raw matches:", rawMatches.length);

  const normalizedMatches = rawMatches
    .map(normalizeMatch)
    .filter(Boolean) as Array<{
    category: string;
    team: string;
    opponent: string;
    matchDate: Date;
    location: string;
    isHome: boolean;
    status: string;
    scoreTeam: number | null;
    scoreOpponent: number | null;
  }>;

  console.log("FFF normalized matches:", normalizedMatches.length);
  console.log("FFF normalized sample:", normalizedMatches[0] || null);

  let created = 0;
  let updated = 0;

  for (const match of normalizedMatches) {
    const existing = await prisma.match.findFirst({
      where: {
        team: match.team,
        opponent: match.opponent,
        matchDate: match.matchDate,
      },
    });

    if (existing) {
      await prisma.match.update({
        where: { id: existing.id },
        data: {
          category: match.category,
          location: match.location,
          isHome: match.isHome,
          status: match.status,
          scoreTeam: match.scoreTeam,
          scoreOpponent: match.scoreOpponent,
        },
      });

      updated += 1;
    } else {
      await prisma.match.create({
        data: match,
      });

      created += 1;
    }
  }

  console.log("FFF import result:", {
    totalFetched: normalizedMatches.length,
    created,
    updated,
  });

  return {
    totalFetched: normalizedMatches.length,
    created,
    updated,
  };
}
