import Container from "@/components/Container";
import { prisma } from "@/lib/prisma";

export default async function PartenairesPage() {
  const partners = await prisma.partner.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-white via-orange-50 to-neutral-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,120,0,0.10),transparent_30%)]" />
        <Container>
          <div className="relative py-16 md:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-csv-black backdrop-blur">
                CS Viriat · Partenaires
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-900 md:text-6xl">
                Nos partenaires font avancer le club.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-700 md:text-lg">
                Entreprises locales, acteurs engagés et soutiens fidèles : merci
                à tous les partenaires qui accompagnent le développement du CS
                Viriat sur et en dehors du terrain.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#liste-partenaires"
                  className="inline-flex items-center justify-center rounded-2xl bg-csv-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Voir les partenaires
                </a>

                <a
                  href="#devenir-partenaire"
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                >
                  Devenir partenaire
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-neutral-200 bg-white">
        <Container>
          <div className="grid gap-6 py-10 md:grid-cols-3">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                Réseau local
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Le club s’appuie sur des partenaires engagés dans la vie locale
                et le développement du territoire.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                Visibilité
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Un partenariat avec le CS Viriat, c’est aussi une présence
                valorisante au sein d’un club dynamique et fédérateur.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                Engagement
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Chaque soutien contribue à la structuration du club, à ses
                événements et à l’accompagnement de ses équipes.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section id="liste-partenaires" className="bg-white">
        <Container>
          <div className="py-14 md:py-18">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
                Les partenaires du CS Viriat
              </h2>

              <p className="mt-3 text-base leading-relaxed text-neutral-700">
                Découvrez les structures qui soutiennent le club et participent
                à son rayonnement.
              </p>
            </div>

            {partners.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-sm text-neutral-600">
                Aucun partenaire public n’est encore affiché pour le moment.
              </div>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {partners.map((partner) => (
                  <article
                    key={partner.id}
                    className="group flex h-full flex-col rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex min-h-[88px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className="max-h-16 w-auto object-contain"
                        />
                      ) : (
                        <div className="text-center text-sm font-bold text-neutral-400">
                          Logo à venir
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex-1">
                      <h3 className="text-lg font-extrabold text-neutral-900">
                        {partner.name}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                        {partner.description ||
                          "Partenaire du CS Viriat engagé aux côtés du club."}
                      </p>
                    </div>

                    <div className="mt-6">
                      {partner.websiteUrl ? (
                        <a
                          href={partner.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                        >
                          Visiter le site
                        </a>
                      ) : (
                        <div className="text-xs font-medium text-neutral-400">
                          Site web non renseigné
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      <section
        id="devenir-partenaire"
        className="border-t border-neutral-200 bg-neutral-950 text-white"
      >
        <Container>
          <div className="grid gap-8 py-14 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-18">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                Devenir partenaire du CS Viriat
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
                Vous souhaitez associer votre image à un club ancré localement,
                dynamique et ambitieux ? Rejoignez l’aventure et construisons
                ensemble un partenariat utile, visible et durable.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm font-bold uppercase tracking-wide text-white/60">
                Contact sponsoring
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/80">
                Pour toute demande de partenariat, de visibilité ou d’opération
                commune, contactez le club via la page contact.
              </p>

              <div className="mt-6">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:opacity-90"
                >
                  Nous contacter
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
