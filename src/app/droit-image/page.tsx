import { redirect } from "next/navigation";
import Container from "@/components/Container";
import ImageConsentPublicForm from "@/components/ImageConsentPublicForm";
import { prisma } from "@/lib/prisma";
import { CURRENT_FOOTBALL_SEASON } from "@/lib/football-season";
import { CLUB_TEAMS } from "@/lib/teams";
import {
  IMAGE_CONSENT_POLICY_TEXT,
  IMAGE_CONSENT_POLICY_VERSION,
  normalizeConsentIdentity,
  shouldPublishPlayerPhoto,
} from "@/lib/image-consent";

export const metadata = {
  title: "Droit à l'image | CS Viriat",
  description: "Formulaire d'autorisation de droit à l'image du CS Viriat.",
};

type PageProps = {
  searchParams: Promise<{ sent?: string; error?: string }>;
};

export default async function ImageConsentPage({ searchParams }: PageProps) {
  const query = await searchParams;

  async function submitConsent(formData: FormData) {
    "use server";

    // Champ invisible anti-robot : un humain ne doit jamais le remplir.
    if (String(formData.get("website") || "").trim()) {
      redirect("/droit-image?sent=1");
    }

    const playerFirstName = String(formData.get("playerFirstName") || "").trim();
    const playerLastName = String(formData.get("playerLastName") || "").trim();
    const team = String(formData.get("team") || "").trim();
    const personType = String(formData.get("personType") || "").trim();
    const choice = String(formData.get("choice") || "").trim();
    const respondentName = String(formData.get("respondentName") || "").trim();
    const respondentRole = String(formData.get("respondentRole") || "").trim();
    const respondentEmail = String(formData.get("respondentEmail") || "").trim();

    const isMinor = personType === "minor";

    if (
      !playerFirstName ||
      !playerLastName ||
      !CLUB_TEAMS.includes(team as (typeof CLUB_TEAMS)[number]) ||
      !["adult", "minor"].includes(personType) ||
      !["granted", "refused"].includes(choice) ||
      !respondentName ||
      !respondentRole
    ) {
      redirect("/droit-image?error=missing");
    }

    if (!isMinor && respondentRole !== "player") {
      redirect("/droit-image?error=identity");
    }
    if (isMinor && !["mother", "father", "guardian"].includes(respondentRole)) {
      redirect("/droit-image?error=identity");
    }

    const candidates = await prisma.player.findMany({
      where: { team },
      select: { id: true, firstName: true, lastName: true },
    });

    const firstKey = normalizeConsentIdentity(playerFirstName);
    const lastKey = normalizeConsentIdentity(playerLastName);
    const matches = candidates.filter(
      (player) =>
        normalizeConsentIdentity(player.firstName) === firstKey &&
        normalizeConsentIdentity(player.lastName) === lastKey,
    );

    const matchedPlayer = matches.length === 1 ? matches[0] : null;

    const sameIdentityPlayers = matchedPlayer
      ? (await prisma.player.findMany({
          where: { isActive: true },
          select: { id: true, firstName: true, lastName: true },
        })).filter(
          (player) =>
            normalizeConsentIdentity(player.firstName) === firstKey &&
            normalizeConsentIdentity(player.lastName) === lastKey,
        )
      : [];

    await prisma.$transaction(async (tx) => {
      await tx.imageConsentSubmission.create({
        data: {
          playerId: matchedPlayer?.id || null,
          season: CURRENT_FOOTBALL_SEASON,
          playerFirstName,
          playerLastName,
          team,
          isMinor,
          choice,
          respondentName,
          respondentRole,
          respondentEmail: respondentEmail || null,
          policyVersion: IMAGE_CONSENT_POLICY_VERSION,
          policyText: IMAGE_CONSENT_POLICY_TEXT,
          matched: Boolean(matchedPlayer),
        },
      });

      if (!matchedPlayer) return;

      // Une autorisation concerne la personne, pas seulement son inscription dans
      // une équipe. Si le même joueur existe dans plusieurs effectifs (S1/S2,
      // U15 1/U15 2…), on reporte donc le même consentement sur toutes ses fiches.
      for (const identityPlayer of sameIdentityPlayers) {
        const existing = await tx.playerImageConsent.findUnique({
          where: {
            playerId_season: {
              playerId: identityPlayer.id,
              season: CURRENT_FOOTBALL_SEASON,
            },
          },
        });

        const consent = await tx.playerImageConsent.upsert({
          where: {
            playerId_season: {
              playerId: identityPlayer.id,
              season: CURRENT_FOOTBALL_SEASON,
            },
          },
          create: {
            playerId: identityPlayer.id,
            season: CURRENT_FOOTBALL_SEASON,
            isMinor,
            digitalStatus: choice,
            digitalRespondentName: respondentName,
            digitalRespondentRole: respondentRole,
            digitalRespondentEmail: respondentEmail || null,
            digitalSubmittedAt: new Date(),
            policyVersion: IMAGE_CONSENT_POLICY_VERSION,
          },
          update: {
            isMinor,
            digitalStatus: choice,
            digitalRespondentName: respondentName,
            digitalRespondentRole: respondentRole,
            digitalRespondentEmail: respondentEmail || null,
            digitalSubmittedAt: new Date(),
            policyVersion: IMAGE_CONSENT_POLICY_VERSION,
          },
        });

        const mergedConsent = {
          ...consent,
          paperStatus: existing?.paperStatus || consent.paperStatus,
        };

        await tx.player.update({
          where: { id: identityPlayer.id },
          data: { photoConsent: shouldPublishPlayerPhoto(mergedConsent) },
        });
      }
    });

    redirect("/droit-image?sent=1");
  }

  if (query.sent === "1") {
    return (
      <Container>
        <div className="mx-auto max-w-2xl py-16 sm:py-24">
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-7 text-center shadow-sm sm:p-10">
            <div className="text-4xl">✓</div>
            <h1 className="mt-4 text-3xl font-black text-neutral-950">Réponse enregistrée</h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
              Merci. Votre choix a bien été transmis au CS Viriat pour la saison 2026-2027.
              En cas de besoin, le club pourra vérifier le rapprochement avec la fiche du joueur.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mx-auto max-w-3xl py-10 sm:py-16">
        <div className="rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl sm:p-9">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">CS Viriat</div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Autorisation de droit à l’image</h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-300 sm:text-base">
            Ce formulaire permet d’autoriser ou de refuser l’utilisation de l’image d’un licencié dans le cadre de la communication du club. Le choix est sans incidence sur l’inscription ou la participation aux activités sportives.
          </p>
        </div>

        {query.error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            Certains champs sont manquants ou incohérents. Merci de vérifier le formulaire.
          </div>
        ) : null}

        <ImageConsentPublicForm
          action={submitConsent}
          teams={CLUB_TEAMS}
          policyText={IMAGE_CONSENT_POLICY_TEXT}
        />
      </div>
    </Container>
  );
}
