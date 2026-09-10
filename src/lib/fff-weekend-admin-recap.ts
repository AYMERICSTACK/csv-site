import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { MATCHDAY_CONFIGS, MATCHDAY_SEASON } from "@/lib/fff-matchday-config";
import { parseParisDateTime } from "@/lib/paris-datetime";

const PARIS_TIME_ZONE = "Europe/Paris";
const TEAM_NAMES = MATCHDAY_CONFIGS.map((config) => config.team);

type TeamWeekendState = "synced" | "pending_sync" | "incomplete" | "missing" | "postponed" | "cup" | "rest";

export type WeekendRecapTeam = {
  team: string;
  state: TeamWeekendState;
  dayNumber: number | null;
  resultCount: number | null;
  totalMatches: number | null;
  rankingSyncedAt: string | null;
};

export type WeekendRecap = {
  weekendKey: string;
  start: string;
  end: string;
  activeTeams: number;
  syncedTeams: number;
  allReady: boolean;
  teams: WeekendRecapTeam[];
  sentAt: string | null;
};

function parisDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: PARIS_TIME_ZONE,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function footballWeekend(reference = new Date()) {
  const key = parisDateKey(reference);
  const [year, month, day] = key.split("-").map(Number);
  const surrogate = new Date(Date.UTC(year, month - 1, day));
  const weekday = surrogate.getUTCDay();
  const daysSinceFriday = (weekday - 5 + 7) % 7;
  surrogate.setUTCDate(surrogate.getUTCDate() - daysSinceFriday);
  const startKey = surrogate.toISOString().slice(0, 10);
  surrogate.setUTCDate(surrogate.getUTCDate() + 4);
  const endKey = surrogate.toISOString().slice(0, 10);
  return {
    key: startKey,
    start: parseParisDateTime(`${startKey}T00:00`),
    end: parseParisDateTime(`${endKey}T00:00`),
  };
}

export async function buildWeekendRecap(reference = new Date()): Promise<WeekendRecap> {
  const weekend = footballWeekend(reference);
  const [matches, snapshots, sent] = await Promise.all([
    prisma.match.findMany({
      where: {
        team: { in: [...TEAM_NAMES] },
        matchDate: { gte: weekend.start, lt: weekend.end },
      },
      select: { team: true, competitionType: true, status: true },
    }),
    prisma.fffMatchdaySnapshot.findMany({
      where: {
        season: MATCHDAY_SEASON,
        team: { in: [...TEAM_NAMES] },
        dayDate: { gte: weekend.start, lt: weekend.end },
      },
      orderBy: [{ dayDate: "desc" }, { dayNumber: "desc" }],
    }),
    prisma.fffWeekendAdminRecap.findUnique({ where: { weekendKey: weekend.key } }),
  ]);

  const teams = TEAM_NAMES.map((team): WeekendRecapTeam => {
    const teamMatches = matches.filter((match) => match.team === team);
    const activeLeague = teamMatches.some(
      (match) => match.competitionType === "league" && match.status !== "postponed" && match.status !== "cancelled",
    );
    const postponedLeague = teamMatches.some(
      (match) => match.competitionType === "league" && (match.status === "postponed" || match.status === "cancelled"),
    );
    const hasCup = teamMatches.some((match) => match.competitionType === "cup");

    if (!activeLeague) {
      return {
        team,
        state: postponedLeague ? "postponed" : hasCup ? "cup" : "rest",
        dayNumber: null,
        resultCount: null,
        totalMatches: null,
        rankingSyncedAt: null,
      };
    }

    const snapshot = snapshots.find((item) => item.team === team) ?? null;
    if (!snapshot) {
      return { team, state: "missing", dayNumber: null, resultCount: null, totalMatches: null, rankingSyncedAt: null };
    }
    const common = {
      team,
      dayNumber: snapshot.dayNumber,
      resultCount: snapshot.resultCount,
      totalMatches: snapshot.totalMatches,
      rankingSyncedAt: snapshot.rankingSyncedAt?.toISOString() ?? null,
    };
    if (!snapshot.complete) return { ...common, state: "incomplete" };
    if (!snapshot.rankingSyncedAt) return { ...common, state: "pending_sync" };
    return { ...common, state: "synced" };
  });

  const actionable = teams.filter((team) => !["postponed", "cup", "rest"].includes(team.state));
  const syncedTeams = actionable.filter((team) => team.state === "synced").length;

  return {
    weekendKey: weekend.key,
    start: weekend.start.toISOString(),
    end: weekend.end.toISOString(),
    activeTeams: actionable.length,
    syncedTeams,
    allReady: actionable.length > 0 && actionable.every((team) => team.state === "synced"),
    teams,
    sentAt: sent?.sentAt?.toISOString() ?? null,
  };
}

function labelFor(state: TeamWeekendState) {
  switch (state) {
    case "synced": return "Classement à jour ✅";
    case "pending_sync": return "Classement à synchroniser";
    case "incomplete": return "Résultats FFF incomplets";
    case "missing": return "Contrôle FFF à effectuer";
    case "postponed": return "Championnat reporté / annulé";
    case "cup": return "Coupe — pas de classement";
    default: return "Pas de championnat";
  }
}

function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try { return new URL(configured).origin; } catch {}
  }
  return new URL(request.url).origin;
}

export async function maybeSendAdminWeekendRecap(request: Request, reference: Date) {
  const recap = await buildWeekendRecap(reference);
  if (!recap.allReady || recap.sentAt) return recap;

  await prisma.fffWeekendAdminRecap.upsert({
    where: { weekendKey: recap.weekendKey },
    create: { weekendKey: recap.weekendKey, weekendStart: new Date(recap.start) },
    update: {},
  });

  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  const claim = await prisma.fffWeekendAdminRecap.updateMany({
    where: {
      weekendKey: recap.weekendKey,
      sentAt: null,
      OR: [{ claimedAt: null }, { claimedAt: { lt: staleBefore } }],
    },
    data: { claimedAt: new Date(), lastError: null },
  });
  if (claim.count !== 1) return recap;

  try {
    const from = process.env.RESEND_FROM_EMAIL?.trim();
    if (!resend || !from) throw new Error("Resend n’est pas configuré.");
    const admins = await prisma.user.findMany({
      where: { role: "admin", isActive: true },
      select: { email: true },
      orderBy: { createdAt: "asc" },
    });
    const recipients = Array.from(new Set(admins.map((admin) => admin.email.trim().toLowerCase()).filter(Boolean)));
    if (!recipients.length) throw new Error("Aucun administrateur actif trouvé.");

    const origin = siteOrigin(request);
    const logoUrl = `${origin}/logo-csv-mail.png`;
    const adminUrl = `${origin}/admin`;
    const dateLabel = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", month: "long", year: "numeric", timeZone: PARIS_TIME_ZONE,
    }).format(new Date(recap.start));
    const rows = recap.teams.map((team) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;font-weight:700;">${team.team}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;color:#525252;">${labelFor(team.state)}</td>
      </tr>`).join("");

    const result = await resend.emails.send({
      from,
      to: [recipients[0]],
      ...(recipients.length > 1 ? { bcc: recipients.slice(1) } : {}),
      subject: `Récap FFF — tous les classements du week-end sont à jour`,
      html: `<div style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,sans-serif;color:#171717;"><div style="max-width:680px;margin:0 auto;padding:32px 20px;"><div style="background:#111;border-radius:20px 20px 0 0;padding:24px 28px;text-align:center;"><img src="${logoUrl}" alt="CS Viriat" width="72" height="72" style="display:block;margin:0 auto 12px;"/><div style="font-size:24px;font-weight:800;color:#fff;">CS Viriat</div><div style="margin-top:8px;font-size:13px;color:#ffffffb3;">Récapitulatif classements FFF</div></div><div style="background:#fff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 20px 20px;padding:28px;"><div style="height:4px;width:72px;background:#f97316;border-radius:999px;margin-bottom:24px;"></div><h1 style="margin:0 0 16px;font-size:25px;">Tout est à jour ✅</h1><p style="font-size:15px;line-height:1.7;color:#404040;">Toutes les équipes ayant une journée de championnat à traiter sur le week-end du <strong>${dateLabel}</strong> ont leurs résultats complets et leur classement synchronisé.</p><table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0;background:#fafafa;border:1px solid #eeeeee;border-radius:14px;overflow:hidden;"><tbody>${rows}</tbody></table><p style="font-size:15px;line-height:1.7;color:#404040;"><strong>${recap.syncedTeams}/${recap.activeTeams}</strong> classement${recap.activeTeams > 1 ? "s" : ""} de championnat à jour. Les équipes en coupe, au repos ou avec un match reporté n’ont pas bloqué le contrôle.</p><div style="text-align:center;margin:28px 0;"><a href="${adminUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 22px;border-radius:12px;">Ouvrir le dashboard admin</a></div><p style="font-size:13px;color:#737373;">Ce récapitulatif est envoyé une seule fois par week-end.</p></div><div style="padding:18px;text-align:center;font-size:11px;color:#a3a3a3;">Message automatique du CS Viriat.</div></div></div>`,
    });
    if (result.error) throw new Error(result.error.message || "Erreur Resend.");

    await prisma.fffWeekendAdminRecap.update({
      where: { weekendKey: recap.weekendKey },
      data: { sentAt: new Date(), claimedAt: null, resendId: result.data?.id ?? null, lastError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.fffWeekendAdminRecap.update({
      where: { weekendKey: recap.weekendKey },
      data: { claimedAt: null, lastError: message.slice(0, 1000) },
    });
  }

  return buildWeekendRecap(reference);
}
