import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 1800;

type RankingPreviewRow = {
  rank: number;
  team: string;
  points: number | null;
  isClub: boolean;
};

type CacheEntry = {
  updatedAt: string;
  rows: RankingPreviewRow[];
  found: boolean;
};

const CACHE_TTL = 30 * 60 * 1000;
const CLUB_MATCH = /(?:c\.?\s*s\.?\s*)?viriat/i;
const memoryCache = new Map<string, CacheEntry>();

function isValidPersistentRows(value: unknown): value is RankingPreviewRow[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 4) {
    return false;
  }

  let hasClub = false;

  for (const row of value) {
    if (!row || typeof row !== "object") return false;

    const candidate = row as Partial<RankingPreviewRow>;

    if (
      typeof candidate.rank !== "number" ||
      !Number.isInteger(candidate.rank) ||
      candidate.rank < 1 ||
      candidate.rank > 30 ||
      typeof candidate.team !== "string" ||
      candidate.team.trim().length < 2 ||
      candidate.team.length > 80 ||
      /[{}\[\]"]/.test(candidate.team) ||
      (candidate.points !== null &&
        (typeof candidate.points !== "number" ||
          !Number.isFinite(candidate.points) ||
          candidate.points < 0 ||
          candidate.points > 200)) ||
      typeof candidate.isClub !== "boolean"
    ) {
      return false;
    }

    if (candidate.isClub) {
      if (!CLUB_MATCH.test(candidate.team)) return false;
      hasClub = true;
    }
  }

  return hasClub;
}

async function getPersistentSnapshot(url: string): Promise<CacheEntry | null> {
  const snapshot = await prisma.fffRankingSnapshot.findUnique({
    where: { sourceUrl: url },
  });

  if (!snapshot || !snapshot.found) return null;

  const rows = snapshot.rows as unknown;

  // Les anciens parsings HTML côté serveur pouvaient interpréter le shell
  // Angular / JSON de la FFF comme des lignes de classement. On refuse ces
  // snapshots et on ne publie que des données DOFA validées par la synchro
  // navigateur de l'espace club.
  if (!isValidPersistentRows(rows)) return null;

  return {
    updatedAt: snapshot.lastSuccessAt.toISOString(),
    rows,
    found: true,
  };
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

  let persisted: CacheEntry | null = null;

  try {
    persisted = await getPersistentSnapshot(rankingUrl);
  } catch {
    // Si Neon est momentanément indisponible, on peut encore servir un cache
    // mémoire déjà validé pendant la durée de vie de l'instance Vercel.
  }

  const cached = persisted || memoryCache.get(rankingUrl) || null;

  if (cached) {
    memoryCache.set(rankingUrl, cached);

    return NextResponse.json({
      ...cached,
      cached: true,
      persistent: Boolean(persisted),
      stale: Date.now() - new Date(cached.updatedAt).getTime() >= CACHE_TTL,
      refreshing: false,
    });
  }

  // Important : on ne tente plus de parser le HTML FFF depuis Vercel.
  // Les accès serveur sont bloqués/instables et ce parsing est précisément
  // ce qui a produit les fausses lignes visibles sur la page publique.
  return NextResponse.json(
    {
      error:
        "Classement FFF indisponible et aucun classement synchronisé valide dans Neon",
      rows: [],
    },
    { status: 504 },
  );
}
