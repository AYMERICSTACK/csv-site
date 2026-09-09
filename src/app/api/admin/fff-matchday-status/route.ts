import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getRankingAccess } from "@/lib/fff-ranking-access";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { normalizeTeamName } from "@/lib/teams";
import { MATCHDAY_TEAM, MATCHDAY_SOURCE, MATCHDAY_SEASON, parseMatchdays } from "@/lib/fff-matchday";

export const dynamic = "force-dynamic";

async function allowed() {
  const access = await getRankingAccess();
  return Boolean(access && (access.isAdmin || access.teams?.includes(MATCHDAY_TEAM)));
}

function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try { return new URL(configured).origin; } catch { /* fallback below */ }
  }
  return new URL(request.url).origin;
}

async function getNotificationRecipients() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      email: true,
      role: true,
      favoriteTeam: { select: { category: true } },
      memberships: {
        select: { commission: { select: { slug: true } } },
      },
    },
  });

  const recipients = users
    .filter((user) => {
      const isAdmin = user.role === "admin" || user.memberships.some((membership) => membership.commission.slug === "admin");
      const favorite = user.favoriteTeam?.category ? normalizeTeamName(user.favoriteTeam.category) : null;
      return isAdmin || favorite === MATCHDAY_TEAM;
    })
    .map((user) => user.email.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(recipients));
}

async function sendMatchdayNotification(request: Request, snapshotId: string) {
  const snapshot = await prisma.fffMatchdaySnapshot.findUnique({ where: { id: snapshotId } });
  if (!snapshot || !snapshot.complete || snapshot.rankingSyncedAt || snapshot.notificationSentAt) return;

  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  const claim = await prisma.fffMatchdaySnapshot.updateMany({
    where: {
      id: snapshot.id,
      complete: true,
      rankingSyncedAt: null,
      notificationSentAt: null,
      OR: [
        { notificationClaimedAt: null },
        { notificationClaimedAt: { lt: staleBefore } },
      ],
    },
    data: { notificationClaimedAt: new Date(), notificationLastError: null },
  });

  if (claim.count !== 1) return;

  try {
    const from = process.env.RESEND_FROM_EMAIL?.trim();
    if (!resend || !from) throw new Error("Resend n’est pas configuré.");

    const recipients = await getNotificationRecipients();
    if (!recipients.length) throw new Error("Aucun destinataire trouvé pour le rappel classement.");

    const origin = siteOrigin(request);
    const logoUrl = `${origin}/logo-csv-mail.png`;
    const rankingUrl = `${origin}/espace-educateurs/classements-fff`;
    const dateLabel = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
    }).format(snapshot.dayDate);

    const result = await resend.emails.send({
      from,
      to: [recipients[0]],
      ...(recipients.length > 1 ? { bcc: recipients.slice(1) } : {}),
      subject: `${MATCHDAY_TEAM} — journée ${snapshot.dayNumber} complète, classement à mettre à jour`,
      html: `
        <div style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,sans-serif;color:#171717;">
          <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
            <div style="background:#111111;border-radius:20px 20px 0 0;padding:24px 28px;text-align:center;">
              <img src="${logoUrl}" alt="CS Viriat" width="72" height="72" style="display:block;margin:0 auto 12px;" />
              <div style="font-size:24px;font-weight:800;color:#fff;">CS Viriat</div>
              <div style="margin-top:8px;font-size:13px;color:#ffffffb3;">Suivi sportif</div>
            </div>
            <div style="background:#fff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 20px 20px;padding:28px;">
              <div style="height:4px;width:72px;background:#f97316;border-radius:999px;margin-bottom:24px;"></div>
              <h1 style="margin:0 0 18px;font-size:25px;line-height:1.3;">Journée ${snapshot.dayNumber} complète</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#404040;">
                Tous les résultats officiels de la journée ${snapshot.dayNumber} de <strong>${MATCHDAY_TEAM}</strong> sont maintenant publiés par la FFF.
              </p>
              <div style="margin:22px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:18px;">
                <div style="font-size:16px;font-weight:800;color:#166534;">${snapshot.resultCount} résultats sur ${snapshot.totalMatches}</div>
                <div style="margin-top:5px;font-size:13px;color:#15803d;">Journée du ${dateLabel}</div>
              </div>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#404040;">
                Le classement peut maintenant être synchronisé dans l’espace club.
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${rankingUrl}" style="display:inline-block;background:#111111;color:#fff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 22px;border-radius:12px;">Mettre à jour le classement</a>
              </div>
              <p style="margin:26px 0 0;font-size:13px;line-height:1.6;color:#737373;">
                Ce rappel est envoyé une seule fois par journée complète. Si le classement a déjà été synchronisé, aucune action supplémentaire n’est nécessaire.
              </p>
            </div>
            <div style="padding:18px 20px;text-align:center;font-size:11px;line-height:1.6;color:#a3a3a3;">Message automatique du CS Viriat.</div>
          </div>
        </div>
      `,
    });

    if (result.error) throw new Error(result.error.message || "Erreur Resend.");

    await prisma.fffMatchdaySnapshot.update({
      where: { id: snapshot.id },
      data: {
        notificationSentAt: new Date(),
        notificationClaimedAt: null,
        notificationResendId: result.data?.id ?? null,
        notificationLastError: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FFF matchday notification:", message);
    await prisma.fffMatchdaySnapshot.update({
      where: { id: snapshot.id },
      data: { notificationClaimedAt: null, notificationLastError: message.slice(0, 1000) },
    });
  }
}

export async function GET() {
  if (!(await allowed())) return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  const rows = await prisma.fffMatchdaySnapshot.findMany({
    where: { sourceUrl: MATCHDAY_SOURCE, season: MATCHDAY_SEASON },
    orderBy: { dayNumber: "desc" }, take: 30,
  });
  return NextResponse.json({ days: rows });
}

export async function POST(request: Request) {
  if (!(await allowed())) return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (body?.team !== MATCHDAY_TEAM) return NextResponse.json({ error: "Équipe invalide." }, { status: 400 });

  let days: ReturnType<typeof parseMatchdays>;
  try { days = parseMatchdays(body.dofaPayload); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Données invalides." }, { status: 400 }); }

  if (new Set(days.map((day) => day.number)).size !== days.length) {
    return NextResponse.json({ error: "Journées dupliquées." }, { status: 400 });
  }

  const now = new Date();
  const past = days.filter((day) => day.date.getTime() <= now.getTime());
  const saved = [];

  for (const day of past) {
    const data = {
      team: MATCHDAY_TEAM, competitionId: 454799, phase: 1, poule: 2,
      dayDate: day.date, totalMatches: day.totalMatches, resultCount: day.resultCount,
      complete: day.complete, matches: day.matches as unknown as Prisma.InputJsonValue,
      checkedAt: now,
    };

    const row = await prisma.fffMatchdaySnapshot.upsert({
      where: { sourceUrl_season_dayNumber: { sourceUrl: MATCHDAY_SOURCE, season: MATCHDAY_SEASON, dayNumber: day.number } },
      create: {
        ...data, sourceUrl: MATCHDAY_SOURCE, season: MATCHDAY_SEASON, dayNumber: day.number,
        completedAt: day.complete ? now : null,
      },
      update: data,
    });

    const finalRow = day.complete && !row.completedAt
      ? await prisma.fffMatchdaySnapshot.update({ where: { id: row.id }, data: { completedAt: now } })
      : row;
    saved.push(finalRow);
  }

  const latest = saved
    .filter((row) => row.dayDate.getTime() <= now.getTime())
    .sort((a, b) => b.dayDate.getTime() - a.dayDate.getTime() || b.dayNumber - a.dayNumber)[0];

  if (latest?.complete && !latest.rankingSyncedAt && !latest.notificationSentAt) {
    await sendMatchdayNotification(request, latest.id);
  }

  const refreshed = await prisma.fffMatchdaySnapshot.findMany({
    where: { sourceUrl: MATCHDAY_SOURCE, season: MATCHDAY_SEASON },
    orderBy: { dayNumber: "desc" }, take: 30,
  });

  return NextResponse.json({ days: refreshed });
}
