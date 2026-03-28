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

        {/* Étapes */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="text-xs font-semibold text-neutral-500">
                ÉTAPE
              </div>
              <div className="mt-2 text-sm font-extrabold text-neutral-900">
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
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
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

              <div className="rounded-full bg-csv-orange/10 px-3 py-1 text-xs font-bold text-csv-black">
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
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 transition hover:border-neutral-300 hover:bg-white"
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

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-neutral-900">
              Besoin d’aide ?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Pour toute question sur les catégories, les documents ou les
              inscriptions, contactez le club.
            </p>

            <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
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

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
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
        <div className="mt-12 overflow-hidden rounded-[28px] border border-neutral-200 shadow-sm">
          <div className="bg-csv-black px-8 py-8 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
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
                  className="group rounded-3xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
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

                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
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
                      <span className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-400">
                        {option.cta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5">
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

                <div className="inline-flex items-center rounded-full bg-csv-orange/10 px-3 py-1 text-xs font-bold text-csv-black">
                  HelloAsso / CB
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="mt-10 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
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
                  className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-neutral-300 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
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
                    <span className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-400">
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
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
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
        <div className="mt-12 rounded-3xl border border-neutral-200 bg-csv-black p-10 text-white shadow-sm">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-white/70">
              REJOINDRE LE CSV
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
