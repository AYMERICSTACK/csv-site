import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";

type RankingLine = { rank: number; team: string; points: number | null };
type RankingPreviewRow = RankingLine & { isClub: boolean };
const FETCH_TIMEOUT = 15000;
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


const prisma = new PrismaClient();
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const allowedHost = (host: string) => host === "epreuves.fff.fr";
function validateUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !allowedHost(url.hostname) ||
      !/^\/competition\/club\/[^/]+\/equipe\/[^/]+\/classement\/?$/.test(url.pathname)) {
    throw new Error("URL de classement FFF non autorisée");
  }
  return url.toString();
}
async function fetchRanking(url: string) {
  let response: Response | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    response = await fetchWithTimeout(url);
    if (response.ok || ![429, 500, 502, 503, 504].includes(response.status) || attempt === 3) break;
    await delay(attempt * 2000);
  }
  if (!response) throw new Error("Aucune réponse FFF");
  if (!response.ok) throw new Error(`FFF HTTP ${response.status}`);
  if (!allowedHost(new URL(response.url).hostname)) throw new Error("Redirection hors FFF");
  const html = await response.text();
  const rankings = parseRowsFromTables(html);
  const rows = rankings.length ? rankings : parseRowsFromText(html);
  if (!rows.length) throw new Error("Aucune ligne de classement détectée");
  const preview = buildPreview(rows);
  if (!preview.found || !preview.rows.length) {
    throw new Error("Équipe Viriat absente du classement : snapshot conservé");
  }
  return preview;
}
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquante");
  const settings = await prisma.teamSetting.findMany({
    where: { fffUrl: { not: null } },
    select: { team: true, fffUrl: true },
  });
  const urls = [...new Set(settings.map(s => s.fffUrl?.trim()).filter((s): s is string => Boolean(s))
    .filter(s => { try { validateUrl(s); return true; } catch { return false; } }))];
  console.log(`${urls.length} classement(s) FFF configuré(s).`);
  let success = 0, failed = 0;
  for (const sourceUrl of urls) {
    const url = validateUrl(sourceUrl);
    try {
      const preview = await fetchRanking(url);
      const now = new Date();
      await prisma.fffRankingSnapshot.upsert({
        where: { sourceUrl: url },
        update: { rows: preview.rows as unknown as Prisma.InputJsonValue, found: true,
          fetchedAt: now, lastSuccessAt: now, lastError: null },
        create: { sourceUrl: url, rows: preview.rows as unknown as Prisma.InputJsonValue,
          found: true, fetchedAt: now, lastSuccessAt: now },
      });
      success++;
      console.log(`OK ${url} (${preview.rows.length} lignes)`);
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ÉCHEC ${url}: ${message}`);
      await prisma.fffRankingSnapshot.updateMany({
        where: { sourceUrl: url },
        data: { lastError: message.slice(0, 500) },
      });
    }
    await delay(1500);
  }
  console.log(`Bilan : ${success} réussi(s), ${failed} échec(s).`);
  if (failed || !urls.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
