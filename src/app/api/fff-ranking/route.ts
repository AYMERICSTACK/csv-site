import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  return decodeHtml(value.replace(/\s+/g, " ").trim());
}

function cleanFallbackTeamName(value: string) {
  return decodeHtml(
    value
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

// Compatible avec l’ancien tableau FFF et le tableau Angular CDK 2026/2027.
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
        /cdk-column-rank|cdk-column-position|cdk-column-classement/i.test(cell.attrs),
      ) || cells[0];

    const rank = toNumber(rankCell?.text || "");
    if (!rank) continue;

    const pointsCell = cells.find((cell) =>
      /cdk-column-points/i.test(cell.attrs),
    );

    const points = pointsCell ? toNumber(pointsCell.text) : null;

    const teamCell =
      cells.find((cell) =>
        /cdk-column-team|cdk-column-name|cdk-column-club|cdk-column-nomEquipe/i.test(cell.attrs),
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
    const team = cleanFallbackTeamName(match[2]);
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
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: "https://epreuves.fff.fr/",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function savePersistentSnapshot(url: string, entry: CacheEntry) {
  await prisma.fffRankingSnapshot.upsert({
    where: { sourceUrl: url },
    update: {
      rows: entry.rows as unknown as Prisma.InputJsonValue,
      found: entry.found,
      fetchedAt: new Date(entry.updatedAt),
      lastSuccessAt: new Date(entry.updatedAt),
      lastError: null,
    },
    create: {
      sourceUrl: url,
      rows: entry.rows as unknown as Prisma.InputJsonValue,
      found: entry.found,
      fetchedAt: new Date(entry.updatedAt),
      lastSuccessAt: new Date(entry.updatedAt),
    },
  });
}

async function getPersistentSnapshot(url: string): Promise<CacheEntry | null> {
  const snapshot = await prisma.fffRankingSnapshot.findUnique({
    where: { sourceUrl: url },
  });

  if (!snapshot) return null;

  const rows = Array.isArray(snapshot.rows)
    ? (snapshot.rows as unknown as RankingPreviewRow[])
    : [];

  return {
    updatedAt: snapshot.lastSuccessAt.toISOString(),
    rows,
    found: snapshot.found,
  };
}

async function recordRefreshError(url: string, message: string) {
  try {
    await prisma.fffRankingSnapshot.update({
      where: { sourceUrl: url },
      data: { lastError: message.slice(0, 500) },
    });
  } catch {
    // Aucun snapshot n'existe encore : rien à mettre à jour.
  }
}

async function refreshRanking(url: string): Promise<CacheEntry | null> {
  if (refreshInProgress.has(url)) return memoryCache.get(url) || null;

  refreshInProgress.add(url);

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      await recordRefreshError(url, `FFF HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    const rankings = parseRowsFromTables(html);
    const fallbackRankings = rankings.length
      ? rankings
      : parseRowsFromText(html);

    if (!fallbackRankings.length) {
      await recordRefreshError(url, "Aucune ligne de classement détectée");
      return null;
    }

    const preview = buildPreview(fallbackRankings);
    const entry: CacheEntry = {
      updatedAt: new Date().toISOString(),
      rows: preview.rows,
      found: preview.found,
    };

    memoryCache.set(url, entry);
    await savePersistentSnapshot(url, entry);

    return entry;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur FFF inconnue";
    await recordRefreshError(url, message);
    return null;
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
  const memory = memoryCache.get(rankingUrl);

  let persisted: CacheEntry | null = null;

  try {
    persisted = await getPersistentSnapshot(rankingUrl);
  } catch {
    // Si Neon est momentanément indisponible, le cache mémoire reste utilisable.
  }

  const cached = memory || persisted;
  const isFresh =
    cached && Date.now() - new Date(cached.updatedAt).getTime() < CACHE_TTL;

  if (isFresh) {
    if (!memory && persisted) {
      memoryCache.set(rankingUrl, persisted);
    }

    return NextResponse.json({
      ...cached,
      cached: true,
      persistent: Boolean(persisted),
      stale: false,
      refreshing: false,
    });
  }

  const refreshed = await refreshRanking(rankingUrl);

  if (refreshed) {
    return NextResponse.json({
      ...refreshed,
      cached: false,
      persistent: true,
      stale: false,
      refreshing: false,
    });
  }

  // En production la FFF peut bloquer les IP Vercel (403). Dans ce cas,
  // on sert le dernier classement enregistré dans Neon, même s'il est ancien.
  const fallback = persisted || memory;

  if (fallback) {
    if (!memoryCache.has(rankingUrl)) {
      memoryCache.set(rankingUrl, fallback);
    }

    return NextResponse.json({
      ...fallback,
      cached: true,
      persistent: Boolean(persisted),
      stale: true,
      refreshing: false,
    });
  }

  return NextResponse.json(
    {
      error:
        "Classement FFF indisponible et aucun classement synchronisé dans Neon",
      rows: [],
    },
    { status: 504 },
  );
}
