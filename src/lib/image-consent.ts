export const IMAGE_CONSENT_POLICY_VERSION = "2026-2027-v1";

export const IMAGE_CONSENT_POLICY_TEXT = `Dans le cadre de ses activités sportives et de sa communication, le CS Viriat peut être amené à réaliser et utiliser des photographies ou vidéos de ses licenciés. L'autorisation porte sur les images réalisées lors des matchs, entraînements, tournois, manifestations et événements du club, et sur leur diffusion sur le site internet officiel du CS Viriat, les réseaux sociaux officiels du club, les supports numériques et les supports imprimés du club. Ces images sont utilisées pour informer sur la vie du club, présenter ses équipes, valoriser ses activités sportives et communiquer sur ses événements. L'autorisation est valable pour la saison 2026-2027 et peut être retirée ultérieurement auprès du club.`;

export type ConsentState = "granted" | "pending" | "refused";

type ConsentLike = {
  isMinor: boolean | null;
  paperStatus: string;
  digitalStatus: string;
} | null | undefined;

export function getImageConsentState(consent: ConsentLike, legacyPhotoConsent = false): ConsentState {
  if (!consent) return legacyPhotoConsent ? "granted" : "pending";
  if (["refused", "withdrawn"].includes(consent.digitalStatus)) return "refused";
  if (consent.paperStatus === "refused") return "refused";
  if (consent.digitalStatus !== "granted") return "pending";
  if (consent.isMinor === true && consent.paperStatus !== "received") return "pending";
  return "granted";
}

export function shouldPublishPlayerPhoto(consent: ConsentLike) {
  return getImageConsentState(consent) === "granted";
}

export function consentStateLabel(state: ConsentState) {
  if (state === "granted") return "Autorisé";
  if (state === "refused") return "Refusé";
  return "En attente";
}

export function normalizeConsentIdentity(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-'’]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
