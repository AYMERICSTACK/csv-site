export const revalidate = 900;

import HomeHero from "@/components/HomeHero";
import Container from "@/components/Container";
import Button from "@/components/Button";
import SectionHeader from "@/components/SectionHeader";
import HomeWeekendMatches from "@/components/HomeWeekendMatches";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeWeekendMatches />

      <section>
        <Container>
          <div className="py-14">
            <SectionHeader
              eyebrow="ADN DU CLUB"
              title="Former, rassembler, performer — avec le sourire"
              subtitle="Une organisation claire et une vraie vie de club : l’objectif est de progresser, tout en gardant l’esprit familial qui fait la force du CSV."
            />

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "École de foot",
                  text: "Accueil des plus jeunes, apprentissage, plaisir du jeu.",
                },
                {
                  title: "Compétition",
                  text: "Des objectifs adaptés, du sérieux, et une progression continue.",
                },
                {
                  title: "Vie du club",
                  text: "Événements, tournois, partenaires, moments partagés.",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="text-sm font-extrabold text-neutral-900">
                    {c.title}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-neutral-700">
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-neutral-50">
        <Container>
          <div className="py-14">
            <SectionHeader
              eyebrow="PARTENAIRES"
              title="Merci à ceux qui soutiennent le CSV"
              subtitle="Visibilité claire et cohérente : une page dédiée et des mises en avant régulières."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-2xl border border-neutral-200 bg-white p-6 text-sm font-semibold text-neutral-500"
                >
                  Logo partenaire
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Button href="/partenaires" variant="ghost">
                Découvrir nos partenaires
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <div className="py-14">
            <div className="rounded-3xl border border-neutral-200 bg-csv-black p-10 text-white shadow-sm">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold text-white/70">
                  REJOINDRE LE CLUB
                </div>
                <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">
                  Envie de rejoindre le CS Viriat ?
                </h2>
                <p className="mt-3 text-white/80 leading-relaxed">
                  Toutes les informations d’inscription (tarifs, dossier,
                  contacts) sont centralisées sur la page dédiée.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/inscriptions"
                    className="inline-flex items-center justify-center rounded-xl bg-csv-orange px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    S’inscrire
                  </a>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Poser une question
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
