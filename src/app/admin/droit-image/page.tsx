import Link from "next/link";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { CURRENT_FOOTBALL_SEASON } from "@/lib/football-season";
import {
  consentStateLabel,
  getImageConsentState,
  shouldPublishPlayerPhoto,
  normalizeConsentIdentity,
} from "@/lib/image-consent";

function statusClasses(status: "granted" | "pending" | "refused") {
  if (status === "granted") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "refused") return "bg-red-100 text-red-800 border-red-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
}

function paperLabel(status: string) {
  if (status === "received") return "Papier reçu";
  if (status === "refused") return "Papier : refus";
  return "Papier à vérifier";
}

function digitalLabel(status: string) {
  if (status === "granted") return "Numérique : oui";
  if (status === "refused") return "Numérique : non";
  if (status === "withdrawn") return "Numérique : retiré";
  return "Numérique : en attente";
}

type PageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function AdminImageConsentPage({ searchParams }: PageProps) {
  await requireRole(["admin"]);
  const season = CURRENT_FOOTBALL_SEASON;
  const resolvedSearchParams = await searchParams;
  const requestedStatus = resolvedSearchParams?.status;
  const activeStatus =
    requestedStatus === "granted" || requestedStatus === "pending" || requestedStatus === "refused"
      ? requestedStatus
      : "all";

  async function updatePaperStatus(formData: FormData) {
    "use server";
    await requireRole(["admin"]);
    const playerId = String(formData.get("playerId") || "");
    const paperStatus = String(formData.get("paperStatus") || "");
    if (!playerId || !["pending", "received", "refused"].includes(paperStatus)) return;

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!player) return;

    const firstKey = normalizeConsentIdentity(player.firstName);
    const lastKey = normalizeConsentIdentity(player.lastName);
    const identityPlayers = (await prisma.player.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
    })).filter(
      (candidate) =>
        normalizeConsentIdentity(candidate.firstName) === firstKey &&
        normalizeConsentIdentity(candidate.lastName) === lastKey,
    );

    await prisma.$transaction(async (tx) => {
      for (const identityPlayer of identityPlayers) {
        const current = await tx.playerImageConsent.findUnique({
          where: { playerId_season: { playerId: identityPlayer.id, season } },
        });

        const consent = await tx.playerImageConsent.upsert({
          where: { playerId_season: { playerId: identityPlayer.id, season } },
          create: {
            playerId: identityPlayer.id,
            season,
            isMinor: true,
            paperStatus,
            paperReceivedAt: paperStatus === "received" ? new Date() : null,
          },
          update: {
            paperStatus,
            paperReceivedAt: paperStatus === "received" ? new Date() : null,
          },
        });

        await tx.player.update({
          where: { id: identityPlayer.id },
          data: {
            photoConsent: shouldPublishPlayerPhoto({
              ...consent,
              isMinor: current?.isMinor ?? consent.isMinor,
            }),
          },
        });
      }
    });

    revalidatePath("/admin/droit-image");
    revalidatePath("/admin/equipes");
  }

  async function linkSubmission(formData: FormData) {
    "use server";
    await requireRole(["admin"]);
    const submissionId = String(formData.get("submissionId") || "");
    const playerId = String(formData.get("playerId") || "");
    if (!submissionId || !playerId) return;

    const [submission, player] = await Promise.all([
      prisma.imageConsentSubmission.findUnique({ where: { id: submissionId } }),
      prisma.player.findUnique({ where: { id: playerId } }),
    ]);
    if (!submission || !player || submission.season !== season) return;

    const firstKey = normalizeConsentIdentity(player.firstName);
    const lastKey = normalizeConsentIdentity(player.lastName);
    const identityPlayers = (await prisma.player.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
    })).filter(
      (candidate) =>
        normalizeConsentIdentity(candidate.firstName) === firstKey &&
        normalizeConsentIdentity(candidate.lastName) === lastKey,
    );

    await prisma.$transaction(async (tx) => {
      for (const identityPlayer of identityPlayers) {
        const nextConsent = await tx.playerImageConsent.upsert({
          where: { playerId_season: { playerId: identityPlayer.id, season } },
          create: {
            playerId: identityPlayer.id,
            season,
            isMinor: submission.isMinor,
            digitalStatus: submission.choice,
            digitalRespondentName: submission.respondentName,
            digitalRespondentRole: submission.respondentRole,
            digitalRespondentEmail: submission.respondentEmail,
            digitalSubmittedAt: submission.createdAt,
            policyVersion: submission.policyVersion,
          },
          update: {
            isMinor: submission.isMinor,
            digitalStatus: submission.choice,
            digitalRespondentName: submission.respondentName,
            digitalRespondentRole: submission.respondentRole,
            digitalRespondentEmail: submission.respondentEmail,
            digitalSubmittedAt: submission.createdAt,
            policyVersion: submission.policyVersion,
          },
        });

        await tx.player.update({
          where: { id: identityPlayer.id },
          data: { photoConsent: shouldPublishPlayerPhoto(nextConsent) },
        });
      }

      await tx.imageConsentSubmission.update({
        where: { id: submissionId },
        data: { playerId, matched: true },
      });
    });
    revalidatePath("/admin/droit-image");
    revalidatePath("/admin/equipes");
  }

  const [players, unmatched] = await Promise.all([
    prisma.player.findMany({
      where: { isActive: true },
      include: {
        imageConsents: { where: { season }, take: 1 },
      },
      orderBy: [{ team: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.imageConsentSubmission.findMany({
      where: { season, matched: false },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const counts = players.reduce(
    (acc, player) => {
      const state = getImageConsentState(player.imageConsents[0], player.photoConsent);
      acc[state] += 1;
      return acc;
    },
    { granted: 0, pending: 0, refused: 0 },
  );

  const filteredPlayers =
    activeStatus === "all"
      ? players
      : players.filter(
          (player) =>
            getImageConsentState(player.imageConsents[0], player.photoConsent) === activeStatus,
        );

  const playersByTeam = new Map<string, typeof players>();
  for (const player of filteredPlayers) {
    const key = player.team || "Sans équipe";
    playersByTeam.set(key, [...(playersByTeam.get(key) || []), player]);
  }

  return (
    <Container>
      <div className="py-10 sm:py-14">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700">← Tableau de bord</Link>
          <Link href="/droit-image" target="_blank" className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-white">Voir le formulaire public ↗</Link>
        </div>

        <section className="mt-5 rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-8">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Saison {season}</div>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Droit à l’image</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-300">
            Registre opérationnel des autorisations. Pour les mineurs, le statut vert exige la confirmation numérique et le document papier enregistré comme reçu.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/admin/droit-image"
              aria-current={activeStatus === "all" ? "page" : undefined}
              className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70 ${
                activeStatus === "all"
                  ? "border-white/70 bg-white/15 ring-1 ring-white/40"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="text-3xl font-black text-white">{players.length}</div>
              <div className="mt-1 text-sm font-bold">Tous les joueurs</div>
              <div className="mt-2 text-xs font-semibold text-neutral-400 group-hover:text-neutral-200">Afficher tout</div>
            </Link>

            <Link
              href="/admin/droit-image?status=granted"
              aria-current={activeStatus === "granted" ? "page" : undefined}
              className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                activeStatus === "granted"
                  ? "border-emerald-300 bg-emerald-500/25 ring-1 ring-emerald-300/60"
                  : "border-emerald-500/20 bg-emerald-500/15"
              }`}
            >
              <div className="text-3xl font-black text-emerald-300">{counts.granted}</div>
              <div className="mt-1 text-sm font-bold">🟢 Autorisés</div>
              <div className="mt-2 text-xs font-semibold text-emerald-200/70 group-hover:text-emerald-100">Filtrer les autorisés</div>
            </Link>

            <Link
              href="/admin/droit-image?status=pending"
              aria-current={activeStatus === "pending" ? "page" : undefined}
              className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                activeStatus === "pending"
                  ? "border-amber-300 bg-amber-500/25 ring-1 ring-amber-300/60"
                  : "border-amber-500/20 bg-amber-500/15"
              }`}
            >
              <div className="text-3xl font-black text-amber-300">{counts.pending}</div>
              <div className="mt-1 text-sm font-bold">🟠 En attente</div>
              <div className="mt-2 text-xs font-semibold text-amber-200/70 group-hover:text-amber-100">Filtrer les attentes</div>
            </Link>

            <Link
              href="/admin/droit-image?status=refused"
              aria-current={activeStatus === "refused" ? "page" : undefined}
              className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:bg-red-500/25 focus:outline-none focus:ring-2 focus:ring-red-300 ${
                activeStatus === "refused"
                  ? "border-red-300 bg-red-500/25 ring-1 ring-red-300/60"
                  : "border-red-500/20 bg-red-500/15"
              }`}
            >
              <div className="text-3xl font-black text-red-300">{counts.refused}</div>
              <div className="mt-1 text-sm font-bold">🔴 Refusés</div>
              <div className="mt-2 text-xs font-semibold text-red-200/70 group-hover:text-red-100">Filtrer les refusés</div>
            </Link>
          </div>
        </section>

        {unmatched.length ? (
          <section className="mt-7 rounded-[2rem] border border-amber-200 bg-amber-50 p-5 sm:p-7">
            <h2 className="text-xl font-black text-amber-950">Réponses à rapprocher ({unmatched.length})</h2>
            <p className="mt-1 text-sm text-amber-800">Le nom/prénom/équipe n’a pas permis de retrouver un joueur unique. Choisis la bonne fiche.</p>
            <div className="mt-5 space-y-3">
              {unmatched.map((submission) => {
                const teamPlayers = players.filter((player) => player.team === submission.team);
                return (
                  <form key={submission.id} action={linkSubmission} className="rounded-2xl border border-amber-200 bg-white p-4">
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-black text-neutral-950">{submission.playerFirstName} {submission.playerLastName} · {submission.team}</div>
                        <div className="mt-1 text-xs text-neutral-500">Réponse : {submission.choice === "granted" ? "AUTORISE" : "REFUSE"} · {submission.isMinor ? "mineur" : "majeur"} · {submission.respondentName}</div>
                      </div>
                      <div className="flex min-w-0 gap-2">
                        <select name="playerId" required defaultValue="" className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                          <option value="" disabled>Choisir le joueur</option>
                          {teamPlayers.map((player) => <option key={player.id} value={player.id}>{player.firstName} {player.lastName}</option>)}
                        </select>
                        <button className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-white">Rattacher</button>
                      </div>
                    </div>
                  </form>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-7 space-y-6">
          {filteredPlayers.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
              <div className="text-lg font-black text-neutral-950">Aucun joueur dans ce filtre</div>
              <p className="mt-2 text-sm text-neutral-500">Choisis une autre carte pour afficher les joueurs correspondants.</p>
              <Link href="/admin/droit-image" className="mt-4 inline-flex rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-white">Afficher tous les joueurs</Link>
            </div>
          ) : null}
          {[...playersByTeam.entries()].map(([team, teamPlayers]) => (
            <div key={team} className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-neutral-950">{team}</h2>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">{teamPlayers.length} joueur(s)</span>
              </div>
              <div className="mt-4 grid gap-3">
                {teamPlayers.map((player) => {
                  const consent = player.imageConsents[0];
                  const state = getImageConsentState(consent, player.photoConsent);
                  const paperApplicable =
                    consent?.isMinor === true ||
                    /^(U7|U9|U11|U13|U15|U17)(?:\s|$)/.test(player.team || "");
                  return (
                    <div key={player.id} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-black text-neutral-950">{player.firstName} {player.lastName}</div>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusClasses(state)}`}>{state === "granted" ? "🟢" : state === "refused" ? "🔴" : "🟠"} {consentStateLabel(state)}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-neutral-600">
                            <span className="rounded-full bg-neutral-100 px-2.5 py-1">{digitalLabel(consent?.digitalStatus || "pending")}</span>
                            {consent?.isMinor === true ? <span className="rounded-full bg-neutral-100 px-2.5 py-1">{paperLabel(consent.paperStatus)}</span> : null}
                            {!consent && player.photoConsent ? <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">Autorisation existante · à régulariser dans V19</span> : null}
                            {consent?.digitalRespondentName ? <span className="rounded-full bg-neutral-100 px-2.5 py-1">Réponse : {consent.digitalRespondentName}</span> : null}
                          </div>
                        </div>

                        {paperApplicable ? (
                          <form action={updatePaperStatus} className="flex flex-wrap gap-2">
                            <input type="hidden" name="playerId" value={player.id} />
                            <select name="paperStatus" defaultValue={consent?.paperStatus || "pending"} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                              <option value="pending">Papier à vérifier</option>
                              <option value="received">Papier reçu</option>
                              <option value="refused">Refus papier</option>
                            </select>
                            <button className="rounded-xl bg-csv-orange px-4 py-2 text-sm font-bold text-white">Enregistrer</button>
                          </form>
                        ) : (
                          <span className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-500">Papier non requis si majeur</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </Container>
  );
}
