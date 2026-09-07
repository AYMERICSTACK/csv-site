import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LAURA_URL =
  "https://laurafoot.fff.fr/competitions?tab=ranking&id=457862&phase=1&poule=8&type=ch";

function stripTags(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(LAURA_URL, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: "https://laurafoot.fff.fr/",
      },
    });

    const html = await response.text();
    const plainText = stripTags(html);

    const diagnostics = {
      source: "laurafoot",
      requestedUrl: LAURA_URL,
      finalUrl: response.url,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      elapsedMs: Date.now() - startedAt,
      htmlLength: html.length,
      signals: {
        hasRankingTab: /ranking-tab/i.test(html),
        hasCdkTable: /cdk-table/i.test(html),
        hasClassementColumn: /cdk-column-classement/i.test(html),
        hasNomEquipeColumn: /cdk-column-nomEquipe/i.test(html),
        hasViriat: /\b(?:C\.?\s*S\.?\s*)?VIRIAT\b/i.test(plainText),
        hasCompetitionId: /457862/.test(html),
      },
      textPreview: plainText.slice(0, 700),
    };

    return NextResponse.json(diagnostics, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        source: "laurafoot",
        requestedUrl: LAURA_URL,
        ok: false,
        elapsedMs: Date.now() - startedAt,
        error: message,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
