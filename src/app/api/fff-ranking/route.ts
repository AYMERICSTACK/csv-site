import { NextRequest, NextResponse } from "next/server";

export const revalidate = 1800;

type RankingLine = {
  rank: number;
  team: string;
  points: number | null;
};

type RankingPreviewRow = RankingLine & {
  isClub: boolean;
};

type CacheEntry = {
  updatedAt: string;
  rows: RankingPreviewRow[];
  found: boolean;
};

const CACHE_TTL = 30 * 60 * 1000; // 30 min
const FETCH_TIMEOUT = 5000; // 5 sec

const memoryCache = new Map<string, CacheEntry>();
const refreshInProgress = new Set<string>();

const CLUB_MATCH = /(?:c\.?\s*s\.?\s*)?viriat/i;

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function toNumber(value: string) {
  const match = value.replace(/\s+/g, " ").match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function cleanTeamName(value: string) {
  return decodeHtml(
    value
      .replace(/\b\d+\b/g, " ")
      .replace(/\bpts?\b/gi, " ")
      .replace(/\bpoints?\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function dedupeRankings(rankings: RankingLine[]) {
  const seen = new Set<string>();

  return rankings.filter((line) => {
    const key = `${line.rank}-${line.team.toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parseRowsFromTables(html: string): RankingLine[] {
  const rows = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));
  const rankings: RankingLine[] = [];

  for (const rowMatch of rows) {
    const rowHtml = rowMatch[1];

    const cellMatches = Array.from(
      rowHtml.matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/gi),
    );

    if (cellMatches.length < 3) continue;

    const cells = cellMatches
      .map((cell) => ({
        attrs: cell[1],
        text: stripTags(cell[2]),
      }))
      .filter((cell) => cell.text);

    const rankCell =
      cells.find((cell) =>
        /cdk-column-rank|cdk-column-position/i.test(cell.attrs),
      ) || cells[0];

    const rank = toNumber(rankCell?.text || "");
    if (!rank) continue;

    const pointsCell = cells.find((cell) =>
      /cdk-column-points/i.test(cell.attrs),
    );

    const points = pointsCell ? toNumber(pointsCell.text) : null;

    const teamCell =
      cells.find((cell) =>
        /cdk-column-team|cdk-column-name|cdk-column-club/i.test(cell.attrs),
      ) ||
      cells.find((cell, index) => {
        if (index === 0) return false;
        if (/^\d+$/.test(cell.text)) return false;
        if (/^(pts?|points?|mj|j|g|n|p|bp|bc|diff)$/i.test(cell.text))
          return false;
        return /[a-zà-ÿ]/i.test(cell.text);
      });

    const team = teamCell ? cleanTeamName(teamCell.text) : "";

    if (!team || team.length < 2) continue;

    rankings.push({ rank, team, points });
  }

  return dedupeRankings(rankings);
}

function parseRowsFromText(html: string): RankingLine[] {
  const text = stripTags(html);
  const lines = text
    .split(/(?=\b\d{1,2}\s+[A-ZÀ-Ÿ])/g)
    .map((line) => line.trim())
    .filter(Boolean);

  const rankings: RankingLine[] = [];

  for (const line of lines) {
    const match = line.match(/^(\d{1,2})\s+(.+?)\s+(\d{1,3})(?:\s|$)/);

    if (!match) continue;

    const rank = Number(match[1]);
    const team = cleanTeamName(match[2]);
    const points = Number(match[3]);

    if (rank && team) {
      rankings.push({ rank, team, points });
    }
  }

  return dedupeRankings(rankings);
}

function buildPreview(rankings: RankingLine[]) {
  const clubIndex = rankings.findIndex((line) => CLUB_MATCH.test(line.team));

  if (clubIndex === -1) {
    return {
      found: false,
      rows: rankings.slice(0, 4).map((line) => ({ ...line, isClub: false })),
    };
  }

  const start = Math.max(
    0,
    Math.min(clubIndex - 2, Math.max(rankings.length - 4, 0)),
  );

  return {
    found: true,
    rows: rankings.slice(start, start + 4).map((line) => ({
      ...line,
      isClub: CLUB_MATCH.test(line.team),
    })),
  };
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CS-Viriat-Rankings/1.0; +https://csviriat.fr)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshRanking(url: string) {
  if (refreshInProgress.has(url)) return;

  refreshInProgress.add(url);

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) return;

    const html = await response.text();
    const rankings = parseRowsFromTables(html);
    const fallbackRankings = rankings.length
      ? rankings
      : parseRowsFromText(html);
    const preview = buildPreview(fallbackRankings);

    memoryCache.set(url, {
      updatedAt: new Date().toISOString(),
      rows: preview.rows,
      found: preview.found,
    });
  } catch {
    // On garde le cache existant si la FFF rame ou ne répond pas.
  } finally {
    refreshInProgress.delete(url);
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL manquante" }, { status: 400 });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  if (!parsedUrl.hostname.endsWith("fff.fr")) {
    return NextResponse.json(
      { error: "Seules les URL FFF sont autorisées" },
      { status: 400 },
    );
  }

  const rankingUrl = parsedUrl.toString();
  const cached = memoryCache.get(rankingUrl);
  const isFresh =
    cached && Date.now() - new Date(cached.updatedAt).getTime() < CACHE_TTL;

  if (isFresh) {
    return NextResponse.json({
      ...cached,
      cached: true,
      refreshing: false,
    });
  }

  if (cached) {
    void refreshRanking(rankingUrl);

    return NextResponse.json({
      ...cached,
      cached: true,
      refreshing: true,
    });
  }

  try {
    await refreshRanking(rankingUrl);

    const freshCache = memoryCache.get(rankingUrl);

    if (freshCache) {
      return NextResponse.json({
        ...freshCache,
        cached: false,
        refreshing: false,
      });
    }

    return NextResponse.json(
      { error: "Classement FFF indisponible", rows: [] },
      { status: 504 },
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de récupérer le classement FFF", rows: [] },
      { status: 504 },
    );
  }
}
