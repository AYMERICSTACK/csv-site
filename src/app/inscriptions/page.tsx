import Container from "@/components/Container";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import RegistrationChoice from "@/components/RegistrationChoice";
import { prisma } from "@/lib/prisma";

const helloAssoLicencesUrl =
  "https://www.helloasso.com/associations/club-sportif-de-viriat/adhesions/licences-2026-2027-csv-football";

const helloAssoWidgetUrl = `${helloAssoLicencesUrl}/widget`;

const renewalAnchor = "#renouvellement-licence";
const newPlayerAnchor = "#nouvelle-inscription";

const steps = [
  {
    title: "Vérifier la catégorie",
    text: "Consulter le tarif correspondant à la catégorie du joueur ou de la joueuse pour la saison 2026/2027.",
  },
  {
    title: "Renouveler en ligne",
    text: "Remplir le formulaire HelloAsso uniquement pour un renouvellement de licence au CS Viriat.",
  },
  {
    title: "Finaliser le dossier",
    text: "Transmettre les éventuels documents complémentaires demandés par le club si besoin.",
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
    a: "Le paiement en ligne via HelloAsso est réservé aux renouvellements de licences. Pour une première inscription, merci de contacter d’abord le club.",
  },
];

export default async function InscriptionsPage() {
  const settings = await prisma.registrationSettings.findFirst();

  const fees = await prisma.registrationFee.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const docs = await prisma.registrationDocument.findMany({
    where: { name: { not: "Tarifs licences 2026/2027" } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const registrationSettings = settings
    ? {
        ...settings,
        seasonLabel: settings.seasonLabel || "Saison 2026/2027",
        helloAssoUrl: settings.helloAssoUrl || helloAssoLicencesUrl,
      }
    : {
        seasonLabel: "Saison 2026/2027",
        introTitle: "Licences 2026/2027 au CS Viriat",
        introText:
          "Retrouvez ici les informations officielles pour l’inscription : étapes, documents, contacts et informations pratiques.",
        periodText: "juin → septembre",
        contactEmail: "csviriat-football@orange.fr",
        helloAssoUrl: helloAssoLicencesUrl,
        cardPaymentUrl: null,
      };

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-white px-6 py-8 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.18)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.06),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-csv-orange/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Inscriptions</Badge>
              <Badge>{registrationSettings.seasonLabel}</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              {registrationSettings.introTitle}
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-700 md:text-lg">
              {registrationSettings.introText}
            </p>
          </div>
        </section>

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

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900">
                  Période d’inscriptions
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Inscriptions :{" "}
                  <span className="font-semibold">
                    {registrationSettings.periodText}
                  </span>
                  .
                </p>
              </div>

              <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                {registrationSettings.seasonLabel}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-extrabold text-neutral-900">
                Tarifs
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Tarifs officiels des licences 2026/2027. Une paire de
                chaussettes et un short sont compris dans le tarif.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {fees.map((item) => (
                  <div
                    key={item.id}
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
                          Info
                        </div>
                        <div className="mt-1 text-base font-bold text-csv-orange">
                          {item.tombola || "Licence"}
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
                  href={`mailto:${registrationSettings.contactEmail}`}
                >
                  {registrationSettings.contactEmail}
                </a>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Button href="/contact">Page Contact</Button>
              <Button href="/equipes" variant="ghost">
                Équipes & horaires
              </Button>
            </div>
          </div>
        </div>

        <RegistrationChoice
          seasonLabel={registrationSettings.seasonLabel}
          helloAssoLicencesUrl={helloAssoLicencesUrl}
          helloAssoWidgetUrl={helloAssoWidgetUrl}
        />

        <div
          id="nouvelle-inscription"
          className="mt-10 scroll-mt-24 rounded-[1.75rem] border border-orange-100 bg-white p-8 shadow-sm"
        >
          <h2 className="text-xl font-extrabold text-neutral-900">
            Nouvelle inscription
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Pour une première licence ou une arrivée au CS Viriat, merci de
            consulter les documents utiles puis de contacter le club avant toute
            démarche en ligne.
          </p>

          <div className="mt-6 grid gap-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-white to-orange-50/25 p-4 transition hover:border-orange-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold text-neutral-900">
                  Tarifs licences 2026/2027
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Disponible
                  </span>
                </div>
              </div>

              <a
                href="/inscriptions/tarifs-licences-2026-2027.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Télécharger le PDF
              </a>
            </div>

            {docs.map((d) => {
              const isAvailable =
                d.status === "Disponible" && Boolean(d.fileUrl);

              return (
                <div
                  key={d.id}
                  className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-white to-orange-50/25 p-4 transition hover:border-orange-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >
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

                  {isAvailable ? (
                    <a
                      href={d.fileUrl || "#"}
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
