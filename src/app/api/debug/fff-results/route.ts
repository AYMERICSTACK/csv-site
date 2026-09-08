import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SOURCES = [
  {
    key: "last-results",
    label: "Derniers résultats de la poule",
    url: "https://api-dofa.fff.fr/api/compets/454799/phases/1/poules/2/resultat",
  },
  {
    key: "matchdays",
    label: "Journées et matchs",
    url: "https://api-dofa.fff.fr/api/compets/454799/phases/1/poules/2/poule_journees?details[]=pouleJourneeWithMatch",
  },
] as const;

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, isActive: true },
  });

  return Boolean(user?.isActive && user.role === "admin");
}

function summarizeJson(data: unknown) {
  if (!data || typeof data !== "object") {
    return {
      topLevelKeys: [] as string[],
      hydraTotalItems: null as unknown,
      hydraMemberCount: null as number | null,
    };
  }

  const record = data as Record<string, unknown>;
  const members = Array.isArray(record["hydra:member"])
    ? record["hydra:member"]
    : null;

  return {
    topLevelKeys: Object.keys(record).slice(0, 30),
    hydraTotalItems: record["hydra:totalItems"] ?? null,
    hydraMemberCount: members?.length ?? null,
  };
}

async function testSource(source: (typeof SOURCES)[number]) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(source.url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "application/ld+json, application/json",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
    });

    const body = await response.text();

    let data: unknown = null;
    try {
      data = JSON.parse(body);
    } catch {
      data = null;
    }

    const summary = summarizeJson(data);

    return {
      key: source.key,
      label: source.label,
      requestedUrl: source.url,
      finalUrl: response.url,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      elapsedMs: Date.now() - startedAt,
      jsonValid: data !== null,
      ...summary,
      successPreview:
        response.ok && data !== null ? JSON.stringify(data).slice(0, 1200) : null,
      errorPreview: response.ok ? null : body.slice(0, 500),
    };
  } catch (error) {
    return {
      key: source.key,
      label: source.label,
      requestedUrl: source.url,
      ok: false,
      status: null,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  }

  const startedAt = Date.now();
  const tests = await Promise.all(SOURCES.map(testSource));

  return NextResponse.json(
    {
      diagnostic: "FFF / DOFA résultats — Seniors 2",
      competition: 454799,
      phase: 1,
      poule: 2,
      testedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      tests,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
