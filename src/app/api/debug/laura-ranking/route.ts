import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DOFA_URL =
  "https://api-dofa.fff.fr/api/compets/457862/phases/1/poules/8/classement_journees?page=1";

export async function GET() {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(DOFA_URL, {
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
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      data = null;
    }

    const collection = data && typeof data === "object"
      ? data as Record<string, unknown> : null;
    const members = Array.isArray(collection?.["hydra:member"])
      ? collection["hydra:member"] as Record<string, unknown>[] : [];
    const viriat = members.find((row) => {
      const equipe = row.equipe as Record<string, unknown> | undefined;
      return typeof equipe?.short_name === "string" &&
        /\bVIRIAT\b/i.test(equipe.short_name);
    });

    return NextResponse.json({
      source: "api-dofa",
      requestedUrl: DOFA_URL,
      finalUrl: response.url,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      elapsedMs: Date.now() - startedAt,
      jsonValid: data !== null,
      totalItems: collection?.["hydra:totalItems"] ?? null,
      receivedItems: members.length,
      viriatFound: Boolean(viriat),
      viriatRank: viriat?.rank ?? null,
      viriatPoints: viriat?.point_count ?? null,
      errorPreview: response.ok ? null : body.slice(0, 300),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json({
      source: "api-dofa",
      requestedUrl: DOFA_URL,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } finally {
    clearTimeout(timeout);
  }
}
