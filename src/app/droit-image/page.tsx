import { redirect } from "next/navigation";
import Container from "@/components/Container";
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

      const existing = await tx.playerImageConsent.findUnique({
        where: {
          playerId_season: {
            playerId: matchedPlayer.id,
            season: CURRENT_FOOTBALL_SEASON,
          },
        },
      });

      const consent = await tx.playerImageConsent.upsert({
        where: {
          playerId_season: {
            playerId: matchedPlayer.id,
            season: CURRENT_FOOTBALL_SEASON,
          },
        },
        create: {
          playerId: matchedPlayer.id,
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

      // Pour un mineur, le numérique seul ne suffit pas dans le fonctionnement
      // choisi par le club : le papier doit également être enregistré comme reçu.
      const mergedConsent = {
        ...consent,
        paperStatus: existing?.paperStatus || consent.paperStatus,
      };

      await tx.player.update({
        where: { id: matchedPlayer.id },
        data: { photoConsent: shouldPublishPlayerPhoto(mergedConsent) },
      });
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

        <form action={submitConsent} className="mt-6 space-y-6">
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">1 · Joueur concerné</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-neutral-700">
                Prénom du joueur
                <input name="playerFirstName" required className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-normal outline-none focus:border-orange-300" />
              </label>
              <label className="text-sm font-bold text-neutral-700">
                Nom du joueur
                <input name="playerLastName" required className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-normal outline-none focus:border-orange-300" />
              </label>
              <label className="text-sm font-bold text-neutral-700 sm:col-span-2">
                Équipe
                <select name="team" required defaultValue="" className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-normal outline-none focus:border-orange-300">
                  <option value="" disabled>Sélectionner l’équipe</option>
                  {CLUB_TEAMS.map((teamName) => <option key={teamName} value={teamName}>{teamName}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4 text-sm font-semibold text-neutral-700">
                <input type="radio" name="personType" value="adult" required className="mt-1" />
                <span><strong className="block text-neutral-950">Joueur majeur</strong>Je réponds pour moi-même.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4 text-sm font-semibold text-neutral-700">
                <input type="radio" name="personType" value="minor" required className="mt-1" />
                <span><strong className="block text-neutral-950">Joueur mineur</strong>Je suis son représentant légal.</span>
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">2 · Personne qui répond</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-neutral-700">
                Nom et prénom
                <input name="respondentName" required className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-normal outline-none focus:border-orange-300" />
              </label>
              <label className="text-sm font-bold text-neutral-700">
                Qualité
                <select name="respondentRole" required defaultValue="" className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-normal outline-none focus:border-orange-300">
                  <option value="" disabled>Sélectionner</option>
                  <option value="player">Joueur majeur</option>
                  <option value="mother">Mère / représentante légale</option>
                  <option value="father">Père / représentant légal</option>
                  <option value="guardian">Autre représentant légal</option>
                </select>
              </label>
              <label className="text-sm font-bold text-neutral-700 sm:col-span-2">
                E-mail <span className="font-normal text-neutral-400">(facultatif)</span>
                <input name="respondentEmail" type="email" className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-normal outline-none focus:border-orange-300" />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">3 · Utilisation de l’image</div>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700">{IMAGE_CONSENT_POLICY_TEXT}</p>
            <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-relaxed text-orange-950">
              <strong>Pour un joueur mineur :</strong> le CS Viriat conserve également son autorisation papier de début de saison. La publication n’est considérée comme validée dans le site que lorsque la confirmation numérique et le contrôle du document papier sont tous les deux positifs.
            </div>
          </section>

          <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">4 · Votre choix</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 font-black text-emerald-800">
                <input type="radio" name="choice" value="granted" required /> J’AUTORISE
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 font-black text-red-800">
                <input type="radio" name="choice" value="refused" required /> JE N’AUTORISE PAS
              </label>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-neutral-500">
              En validant, vous confirmez avoir pris connaissance des usages décrits ci-dessus. Une autorisation accordée peut être retirée ultérieurement en contactant le CS Viriat.
            </p>
          </section>

          <button className="w-full rounded-2xl bg-csv-orange px-6 py-4 text-base font-black text-white shadow-sm transition hover:opacity-90">
            Enregistrer mon choix
          </button>
        </form>
      </div>
    </Container>
  );
}
