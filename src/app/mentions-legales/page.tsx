import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Mentions légales — CS Viriat",
  description:
    "Mentions légales du site officiel du CS Viriat : éditeur, hébergement, propriété intellectuelle et contact.",
};

const sections = [
  {
    title: "Éditeur du site",
    content: [
      `Le présent site est édité par ${site.name}, association sportive située à ${site.city}.`,
      "Le site a pour objectif de présenter les informations utiles du club : actualités, équipes, inscriptions, partenaires, événements, classements et espaces internes réservés aux membres autorisés.",
      `Contact : ${site.email}`,
    ],
  },
  {
    title: "Responsable de publication",
    content: [
      "Le responsable de publication est le représentant légal de l’association CS Viriat.",
      "Pour toute demande liée au contenu publié sur le site, vous pouvez contacter le club par email.",
    ],
  },
  {
    title: "Conception et développement",
    content: [
      "Plateforme digitale conçue et développée pour le CS Viriat.",
      "Développement & maintenance : Aymeric Djeridi.",
    ],
  },
  {
    title: "Hébergement",
    content: [
      "Le site est hébergé par Vercel Inc.",
      "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.",
      "Les données applicatives peuvent être stockées via des services techniques utilisés par le site, notamment pour l’hébergement, la base de données, les fichiers et les emails transactionnels.",
    ],
  },
  {
    title: "Propriété intellectuelle",
    content: [
      "Les textes, visuels, logos, éléments graphiques, photos, documents et contenus présents sur le site sont la propriété du CS Viriat ou de leurs auteurs respectifs.",
      "Toute reproduction, modification ou réutilisation sans autorisation préalable est interdite, sauf usage strictement personnel ou information légale contraire.",
    ],
  },
  {
    title: "Responsabilité",
    content: [
      "Le CS Viriat s’efforce de publier des informations exactes et à jour. Des erreurs ou omissions peuvent toutefois apparaître.",
      "Les liens externes, notamment vers des plateformes officielles, partenaires ou services tiers, sont fournis à titre pratique. Le club ne peut être tenu responsable du contenu ou du fonctionnement de ces sites externes.",
    ],
  },
];

export default function MentionsLegalesPage() {
  return (
    <Container>
      <section className="py-12 md:py-16">
        <div className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-neutral-50 p-6 md:p-8">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-700 ring-1 ring-orange-100">
              Informations légales
            </span>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-neutral-950 md:text-5xl">
              Mentions légales
            </h1>

            <p className="mt-4 text-sm leading-7 text-neutral-600 md:text-base">
              Cette page regroupe les informations légales relatives au site
              officiel du {site.name}.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {sections.map((section) => (
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
              Contact
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Pour signaler une erreur, demander une correction ou obtenir une
              information liée au site, contactez le club.
            </p>

            <a
              href={`mailto:${site.email}`}
              className="mt-5 inline-flex rounded-2xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
            >
              {site.email}
            </a>

            <div className="mt-6 border-t border-neutral-200 pt-5">
              <Link
                href="/politique-confidentialite"
                className="text-sm font-bold text-orange-700 underline-offset-4 hover:underline"
              >
                Voir la politique de confidentialité
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </Container>
  );
}
