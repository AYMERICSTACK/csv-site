import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité — CS Viriat",
  description:
    "Politique de confidentialité du site officiel du CS Viriat : données collectées, utilisation, conservation et droits des utilisateurs.",
};

const privacySections = [
  {
    title: "Données collectées",
    content: [
      "Le site peut collecter des informations transmises volontairement par l’utilisateur via les formulaires, les demandes d’accès ou l’espace club.",
      "Ces données peuvent notamment inclure : nom, prénom, adresse email, numéro de téléphone, rôle au sein du club, commission, message envoyé, informations de profil ou données nécessaires à la gestion interne du club.",
    ],
  },
  {
    title: "Utilisation des données",
    content: [
      "Les données sont utilisées uniquement pour le fonctionnement du site et l’organisation du club : gestion des accès, communication interne, réponses aux messages, suivi des commissions, informations sportives et administratives.",
      "Les informations personnelles ne sont pas vendues à des tiers.",
    ],
  },
  {
    title: "Visibilité des informations membres",
    content: [
      "Certaines informations de contact peuvent être visibles dans l’espace club uniquement si l’utilisateur ou le responsable autorisé choisit de les rendre visibles.",
      "Par défaut, les emails et numéros personnels ne doivent pas être affichés publiquement sans consentement ou paramétrage volontaire.",
    ],
  },
  {
    title: "Comptes et espace privé",
    content: [
      "L’accès à certaines parties du site est réservé aux membres autorisés. Les comptes sont protégés par un mot de passe et des règles de permissions selon les rôles.",
      "Chaque utilisateur est invité à garder ses identifiants confidentiels et à signaler toute utilisation suspecte de son compte.",
    ],
  },
  {
    title: "Services techniques utilisés",
    content: [
      "Le site utilise des services techniques nécessaires à son fonctionnement, notamment pour l’hébergement, la base de données, les fichiers, les emails transactionnels et le déploiement.",
      "Ces services peuvent traiter certaines données uniquement dans le cadre du fonctionnement technique du site.",
    ],
  },
  {
    title: "Durée de conservation",
    content: [
      "Les données sont conservées pendant la durée nécessaire au fonctionnement du club, à la gestion des accès et aux obligations administratives éventuelles.",
      "Un compte ou des données devenus inutiles peuvent être supprimés ou désactivés sur demande, sous réserve des obligations légales ou associatives applicables.",
    ],
  },
  {
    title: "Droits des utilisateurs",
    content: [
      "Chaque utilisateur peut demander l’accès, la correction ou la suppression de ses données personnelles en contactant le club.",
      `Toute demande peut être envoyée à l’adresse suivante : ${site.email}`,
    ],
  },
  {
    title: "Cookies et mesure d’audience",
    content: [
      "Le site peut utiliser des cookies strictement nécessaires à son fonctionnement, notamment pour la connexion, la sécurité et l’expérience utilisateur.",
      "Si des outils de mesure d’audience ou services tiers sont ajoutés ultérieurement, cette politique pourra être mise à jour.",
    ],
  },
  {
    title: "Mise à jour de cette politique",
    content: [
      "Cette politique de confidentialité peut être modifiée afin de suivre l’évolution du site, des services utilisés ou des obligations légales.",
      "La version publiée sur cette page est celle applicable au moment de la consultation.",
    ],
  },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <Container>
      <section className="py-12 md:py-16">
        <div className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-neutral-50 p-6 md:p-8">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-700 ring-1 ring-orange-100">
              Données personnelles
            </span>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-neutral-950 md:text-5xl">
              Politique de confidentialité
            </h1>

            <p className="mt-4 text-sm leading-7 text-neutral-600 md:text-base">
              Cette page explique comment les données personnelles peuvent être
              collectées, utilisées et protégées dans le cadre du site officiel
              du {site.name}.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {privacySections.map((section) => (
              <section
                key={section.title}
                className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-extrabold text-neutral-950">
                  {section.title}
                </h2>

                <div className="mt-4 space-y-3 text-sm leading-7 text-neutral-600">
                  {section.content.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="h-fit rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-neutral-500">
              Vos droits
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Pour demander une correction, une suppression ou une information
              sur vos données, contactez le club.
            </p>

            <a
              href={`mailto:${site.email}`}
              className="mt-5 inline-flex rounded-2xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
            >
              {site.email}
            </a>

            <div className="mt-6 border-t border-neutral-200 pt-5">
              <Link
                href="/mentions-legales"
                className="text-sm font-bold text-orange-700 underline-offset-4 hover:underline"
              >
                Voir les mentions légales
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </Container>
  );
}
