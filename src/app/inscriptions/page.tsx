import Container from "@/components/Container";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

const steps = [
  {
    title: "Préparer le dossier",
    text: "Télécharger la fiche d’inscription et réunir les documents demandés.",
  },
  {
    title: "Compléter & signer",
    text: "Remplir le dossier et vérifier les informations (catégorie, coordonnées, autorisations).",
  },
  {
    title: "Déposer au club",
    text: "Déposer le dossier complet lors des permanences ou auprès du référent.",
  },
];

const docs = [
  { name: "Fiche d’inscription (PDF)", status: "À venir", href: "#" },
  { name: "Règlement intérieur (PDF)", status: "À venir", href: "#" },
  { name: "Autorisation photo (PDF)", status: "À venir", href: "#" },
  {
    name: "Certificat médical (PDF)",
    status: "Disponible",
    href: "/certificat_medical_2025_2026.pdf",
  },
];

const faqs = [
  {
    q: "À partir de quel âge peut-on s’inscrire ?",
    a: "Les catégories dépendent des saisons. La page “Équipes & horaires” sera mise à jour avec les groupes concernés.",
  },
  {
    q: "Peut-on faire un essai ?",
    a: "Oui, selon la période et la catégorie. Contactez-nous via la page “Contact” pour organiser un essai.",
  },
  {
    q: "Quels sont les modes de paiement ?",
    a: "Le club proposera prochainement un paiement en ligne via HelloAsso ou carte bancaire, selon les solutions mises en place.",
  },
];

const paymentOptions = [
  {
    title: "Paiement via HelloAsso",
    text: "Solution simple et sécurisée pour régler l’adhésion en ligne. Le lien officiel sera ajouté prochainement.",
    cta: "Bientôt disponible",
    href: "#",
    available: false,
    tag: "Associatif",
  },
  {
    title: "Paiement par carte bancaire",
    text: "Le paiement par CB pourra être proposé directement en ligne selon la solution retenue par le club.",
    cta: "Bientôt disponible",
    href: "#",
    available: false,
    tag: "En ligne",
  },
];

export default function InscriptionsPage() {
  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-white px-6 py-8 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.18)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.06),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-csv-orange/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Inscriptions</Badge>
              <Badge>Saison 2026</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              S’inscrire au CS Viriat (CSV)
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-700 md:text-lg">
              Retrouvez ici les informations officielles pour l’inscription :
              étapes, documents, contacts et informations pratiques.
            </p>
          </div>
        </section>

        {/* Étapes */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, index) => (
            <div
              key={s.title}
              className="rounded-[1.5rem] border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >
              <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">
                Étape {index + 1}
              </div>

              <div className="mt-4 text-base font-extrabold text-neutral-900">
                {s.title}
              </div>

              <div className="mt-2 text-sm leading-relaxed text-neutral-700">
                {s.text}
              </div>
            </div>
          ))}
        </div>

        {/* Tarifs + aide */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900">
                  Période d’inscriptions
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Inscriptions :{" "}
                  <span className="font-semibold">juin → septembre</span>.
                </p>
              </div>

              <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                Saison 2026
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-extrabold text-neutral-900">
                Tarifs
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Les 30 € de tombola sont récupérables via la vente des tickets.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  { category: "U7 – U9", fee: "150 €", tombola: "30 €" },
                  { category: "U11 – U13", fee: "160 €", tombola: "30 €" },
                  { category: "U15 – U17", fee: "170 €", tombola: "30 €" },
                  { category: "U18", fee: "200 €", tombola: "30 €" },
                  { category: "Seniors", fee: "220 €", tombola: "30 €" },
                ].map((item) => (
                  <div
                    key={item.category}
                    className="rounded-[1.35rem] border border-orange-100 bg-gradient-to-br from-white to-orange-50/35 p-5 transition hover:border-orange-200 hover:shadow-sm"
                  >
                    <div className="text-sm font-extrabold text-neutral-900">
                      {item.category}
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Cotisation
                        </div>
                        <div className="mt-1 text-2xl font-extrabold text-neutral-900">
                          {item.fee}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Tombola
                        </div>
                        <div className="mt-1 text-base font-bold text-csv-orange">
                          + {item.tombola}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-neutral-900">
              Besoin d’aide ?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Pour toute question sur les catégories, les documents ou les
              inscriptions, contactez le club.
            </p>

            <div className="mt-5 rounded-[1.25rem] border border-orange-100 bg-orange-50/50 p-4">
              <div className="text-sm font-bold text-neutral-900">
                Contact officiel
              </div>
              <div className="mt-2 text-sm text-neutral-700">
                <a
                  className="underline underline-offset-2"
                  href="mailto:csviriat-football@orange.fr"
                >
                  csviriat-football@orange.fr
                </a>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Button href="/contact">Page Contact</Button>
              <Button href="/equipes" variant="ghost">
                Équipes & horaires
              </Button>
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-orange-100 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Conseil
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Pense à consulter la page “Équipes & horaires” pour vérifier la
                catégorie et les créneaux correspondants.
              </p>
            </div>
          </div>
        </div>

        {/* Paiement premium */}
        <div className="mt-12 overflow-hidden rounded-[28px] border border-neutral-800 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.4)]">
          <div className="relative bg-neutral-950 px-8 py-8 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.22),transparent_24%)]" />
            <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-csv-orange/20 blur-3xl" />

            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  Paiement en ligne
                </div>

                <h2 className="mt-4 text-2xl font-extrabold tracking-tight md:text-3xl">
                  Réglez prochainement votre cotisation en ligne
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                  Le club prépare une solution de paiement simple, moderne et
                  sécurisée pour faciliter les inscriptions des joueurs et des
                  familles.
                </p>
              </div>

              <div className="rounded-2xl bg-csv-orange px-4 py-3 text-sm font-bold text-white shadow-sm">
                Ouverture prochaine
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  Avantage
                </div>
                <div className="mt-2 text-sm font-bold text-white">
                  Paiement simplifié
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  Sécurité
                </div>
                <div className="mt-2 text-sm font-bold text-white">
                  Solution sécurisée
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  Usage
                </div>
                <div className="mt-2 text-sm font-bold text-white">
                  Familles & licenciés
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white px-8 py-8">
            <div className="grid gap-5 md:grid-cols-2">
              {paymentOptions.map((option) => (
                <div
                  key={option.title}
                  className="group rounded-3xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/25 p-6 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-csv-orange/10 text-csv-orange">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 8.25h19.5m-18 0v7.5a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21.75 15.75v-7.5m-18 0A2.25 2.25 0 0 1 6 6h12a2.25 2.25 0 0 1 2.25 2.25"
                        />
                      </svg>
                    </div>

                    <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                      {option.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold text-neutral-900">
                    {option.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    {option.text}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="text-xs font-medium text-neutral-500">
                      Activation à venir
                    </div>

                    {option.available ? (
                      <a
                        href={option.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        {option.cta}
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-xl border border-orange-100 bg-white px-4 py-2 text-sm font-semibold text-neutral-400">
                        {option.cta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-bold text-neutral-900">
                    Mise en service en préparation
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700">
                    Les liens officiels de paiement seront ajoutés dès
                    validation par le club.
                  </p>
                </div>

                <div className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold text-orange-700">
                  HelloAsso / CB
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="mt-10 rounded-[1.75rem] border border-orange-100 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-neutral-900">Documents</h2>
          <p className="mt-2 text-sm text-neutral-700">
            Téléchargez ici les documents utiles pour préparer votre
            inscription.
          </p>

          <div className="mt-6 grid gap-4">
            {docs.map((d) => {
              const isAvailable = d.status === "Disponible" && d.href !== "#";

              return (
                <div
                  key={d.name}
                  className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-white to-orange-50/25 p-4 transition hover:border-orange-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-csv-orange/10 text-csv-orange">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zm0 0 5 5M9 13h6M9 17h6M9 9h2"
                        />
                      </svg>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-neutral-900">
                        {d.name}
                      </div>

                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isAvailable
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-200 text-neutral-600"
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAvailable ? (
                    <a
                      href={d.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Télécharger le PDF
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-xl border border-orange-100 bg-white px-4 py-2 text-sm font-semibold text-neutral-400">
                      Bientôt disponible
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-xl font-extrabold text-neutral-900">
            Questions fréquentes
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-[1.5rem] border border-orange-100 bg-white p-6 shadow-sm"
              >
                <div className="text-sm font-extrabold text-neutral-900">
                  {f.q}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-neutral-700">
                  {f.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="mt-12 rounded-[2rem] border border-neutral-800 bg-neutral-950 p-10 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-400">
              Rejoindre le CSV
            </div>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
              Prêt à rejoindre le club ?
            </h2>

            <p className="mt-3 leading-relaxed text-white/80">
              Contactez-nous pour une question ou pour organiser un essai selon
              la catégorie.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-csv-orange px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Contacter le club
              </a>
              <a
                href="/club"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Découvrir le club
              </a>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
