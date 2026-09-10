import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getRankingAccess } from "@/lib/fff-ranking-access";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { MATCHDAY_SEASON, getMatchdayConfig, matchdaySource } from "@/lib/fff-matchday-config";
import { parseMatchdays } from "@/lib/fff-matchday";
import { maybeSendAdminWeekendRecap } from "@/lib/fff-weekend-admin-recap";

export const dynamic = "force-dynamic";

async function accessFor(team: string) {
  const access = await getRankingAccess();
  return access && (access.isAdmin || access.teams?.includes(team)) ? access : null;
}
function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) { try { return new URL(configured).origin; } catch {} }
  return new URL(request.url).origin;
}
function normalizedWords(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean).sort().join(" ");
}
async function getNotificationRecipients(responsibleNames: readonly string[]) {
  const wanted = new Set(responsibleNames.map(normalizedWords));
  const users = await prisma.user.findMany({ where: { isActive: true }, select: { name: true, email: true } });
  return Array.from(new Set(users
    .filter(user => user.name && wanted.has(normalizedWords(user.name)))
    .map(user => user.email.trim().toLowerCase()).filter(Boolean)));
}

async function sendMatchdayNotification(request: Request, snapshotId: string, responsibleNames: readonly string[]) {
  const snapshot = await prisma.fffMatchdaySnapshot.findUnique({ where: { id: snapshotId } });
  if (!snapshot || !snapshot.complete || snapshot.rankingSyncedAt || snapshot.notificationSentAt) return;
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  const claim = await prisma.fffMatchdaySnapshot.updateMany({
    where: { id: snapshot.id, complete: true, rankingSyncedAt: null, notificationSentAt: null,
      OR: [{ notificationClaimedAt: null }, { notificationClaimedAt: { lt: staleBefore } }] },
    data: { notificationClaimedAt: new Date(), notificationLastError: null },
  });
  if (claim.count !== 1) return;
  try {
    const from = process.env.RESEND_FROM_EMAIL?.trim();
    if (!resend || !from) throw new Error("Resend n’est pas configuré.");
    const recipients = await getNotificationRecipients(responsibleNames);
    if (!recipients.length) throw new Error(`Aucun responsable actif trouvé pour ${snapshot.team}.`);
    const origin = siteOrigin(request); const logoUrl = `${origin}/logo-csv-mail.png`;
    const rankingUrl = `${origin}/espace-educateurs/classements-fff`;
    const dateLabel = new Intl.DateTimeFormat("fr-FR", { day:"numeric", month:"long", year:"numeric", timeZone:"Europe/Paris" }).format(snapshot.dayDate);
    const result = await resend.emails.send({
      from, to: [recipients[0]], ...(recipients.length > 1 ? { bcc: recipients.slice(1) } : {}),
      subject: `${snapshot.team} — journée ${snapshot.dayNumber} complète, classement à mettre à jour`,
      html: `<div style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,sans-serif;color:#171717;"><div style="max-width:640px;margin:0 auto;padding:32px 20px;"><div style="background:#111;border-radius:20px 20px 0 0;padding:24px 28px;text-align:center;"><img src="${logoUrl}" alt="CS Viriat" width="72" height="72" style="display:block;margin:0 auto 12px;"/><div style="font-size:24px;font-weight:800;color:#fff;">CS Viriat</div><div style="margin-top:8px;font-size:13px;color:#ffffffb3;">Suivi sportif</div></div><div style="background:#fff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 20px 20px;padding:28px;"><div style="height:4px;width:72px;background:#f97316;border-radius:999px;margin-bottom:24px;"></div><h1 style="margin:0 0 18px;font-size:25px;">Journée ${snapshot.dayNumber} complète</h1><p style="font-size:15px;line-height:1.7;color:#404040;">Tous les résultats officiels de la journée ${snapshot.dayNumber} de <strong>${snapshot.team}</strong> sont publiés par la FFF.</p><div style="margin:22px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:18px;"><strong style="color:#166534;">${snapshot.resultCount} résultats sur ${snapshot.totalMatches}</strong><div style="margin-top:5px;font-size:13px;color:#15803d;">Journée du ${dateLabel}</div></div><p style="font-size:15px;line-height:1.7;color:#404040;">Le classement peut maintenant être synchronisé dans l’espace club.</p><div style="text-align:center;margin:28px 0;"><a href="${rankingUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 22px;border-radius:12px;">Mettre à jour le classement</a></div><p style="font-size:13px;color:#737373;">Ce rappel est envoyé une seule fois par journée complète.</p></div><div style="padding:18px;text-align:center;font-size:11px;color:#a3a3a3;">Message automatique du CS Viriat.</div></div></div>`,
    });
    if (result.error) throw new Error(result.error.message || "Erreur Resend.");
    await prisma.fffMatchdaySnapshot.update({ where:{id:snapshot.id}, data:{ notificationSentAt:new Date(), notificationClaimedAt:null, notificationResendId:result.data?.id ?? null, notificationLastError:null } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FFF matchday notification:", message);
    await prisma.fffMatchdaySnapshot.update({ where:{id:snapshot.id}, data:{notificationClaimedAt:null, notificationLastError:message.slice(0,1000)} });
  }
}

export async function GET(request: Request) {
  const team = new URL(request.url).searchParams.get("team")?.trim() || "";
  const config = getMatchdayConfig(team);
  if (!config || !(await accessFor(team))) return NextResponse.json({ error:"Accès interdit." }, {status:403});
  const rows = await prisma.fffMatchdaySnapshot.findMany({ where:{sourceUrl:matchdaySource(config),season:MATCHDAY_SEASON}, orderBy:{dayNumber:"desc"}, take:30 });
  return NextResponse.json({days:rows});
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null); const team = typeof body?.team === "string" ? body.team.trim() : "";
  const config = getMatchdayConfig(team);
  if (!config) return NextResponse.json({error:"Équipe invalide."},{status:400});
  if (!(await accessFor(team))) return NextResponse.json({error:"Accès interdit."},{status:403});
  const sourceUrl = matchdaySource(config);
  let days: ReturnType<typeof parseMatchdays>;
  try { days = parseMatchdays(body.dofaPayload, sourceUrl); }
  catch(error){ return NextResponse.json({error:error instanceof Error?error.message:"Données invalides."},{status:400}); }
  if(new Set(days.map(day=>day.number)).size!==days.length) return NextResponse.json({error:"Journées dupliquées."},{status:400});
  const now=new Date(); const past=days.filter(day=>day.date.getTime()<=now.getTime()); const saved=[];
  for(const day of past){
    const data={team,competitionId:config.competitionId,phase:config.phase,poule:config.poule,dayDate:day.date,totalMatches:day.totalMatches,resultCount:day.resultCount,complete:day.complete,matches:day.matches as unknown as Prisma.InputJsonValue,checkedAt:now};
    const row=await prisma.fffMatchdaySnapshot.upsert({where:{sourceUrl_season_dayNumber:{sourceUrl,season:MATCHDAY_SEASON,dayNumber:day.number}},create:{...data,sourceUrl,season:MATCHDAY_SEASON,dayNumber:day.number,completedAt:day.complete?now:null},update:data});
    const finalRow=day.complete&&!row.completedAt?await prisma.fffMatchdaySnapshot.update({where:{id:row.id},data:{completedAt:now}}):row; saved.push(finalRow);
  }
  const latest=saved.filter(row=>row.dayDate.getTime()<=now.getTime()).sort((a,b)=>b.dayDate.getTime()-a.dayDate.getTime()||b.dayNumber-a.dayNumber)[0];
  if(latest?.complete&&!latest.rankingSyncedAt&&!latest.notificationSentAt) await sendMatchdayNotification(request,latest.id,config.responsibleNames);
  if (latest) await maybeSendAdminWeekendRecap(request, latest.dayDate);
  const refreshed=await prisma.fffMatchdaySnapshot.findMany({where:{sourceUrl,season:MATCHDAY_SEASON},orderBy:{dayNumber:"desc"},take:30});
  return NextResponse.json({days:refreshed});
}
