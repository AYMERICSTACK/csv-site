import Container from "@/components/Container";
import Badge from "@/components/Badge";
import ImageLightboxTrigger from "@/components/actualites/ImageLightboxTrigger";
import { prisma } from "@/lib/prisma";
import {
  CalendarDays,
  Clock,
  FileText,
  Megaphone,
  MapPin,
  ExternalLink,
} from "lucide-react";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/CSViriat.football";
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/cs_viriat/";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortEventDate(date: Date | string | null) {
  if (!date) return "Date à confirmer";

  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatEventTime(date: Date | string | null) {
  if (!date) return null;

  const parsedDate = new Date(date);
  const hours = parsedDate.getHours();
  const minutes = parsedDate.getMinutes();

  if (hours === 0 && minutes === 0) return null;

  return parsedDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTypeLabel(type: string) {
  switch (type) {
    case "gazette":
      return "Gazette";
    case "manifestation":
      return "Manifestation";
    case "annonce":
      return "Annonce";
    default:
      return type;
  }
}

export default async function ActualitesPage() {
  const items = await prisma.newsItem.findMany({
    where: {
      isPublished: true,
    },
    orderBy: [
      { sortOrder: "asc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  const gazettes = items.filter((item) => item.type === "gazette");
  const manifestations = items.filter((item) => item.type === "manifestation");
  const annonces = items.filter((item) => item.type === "annonce");

  const now = new Date();
  const datedManifestations = manifestations.filter((item) => item.eventDate);
  const undatedManifestations = manifestations.filter((item) => !item.eventDate);

  const upcomingManifestations = datedManifestations
    .filter((item) => item.eventDate && new Date(item.eventDate) >= now)
    .sort(
      (a, b) =>
        new Date(a.eventDate as Date).getTime() -
        new Date(b.eventDate as Date).getTime(),
    );

  const pastManifestations = datedManifestations
    .filter((item) => item.eventDate && new Date(item.eventDate) < now)
    .sort(
      (a, b) =>
        new Date(b.eventDate as Date).getTime() -
        new Date(a.eventDate as Date).getTime(),
    );

  const agendaManifestations = [
    ...upcomingManifestations,
    ...undatedManifestations,
    ...pastManifestations,
  ];

  const highlightedManifestation =
    upcomingManifestations[0] || undatedManifestations[0] || pastManifestations[0];

  const manifestationLightboxItems = manifestations
    .filter((item) => !!item.coverImageUrl)
    .map((item) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.coverImageUrl as string,
    }));

  const annonceLightboxItems = annonces
    .filter((item) => !!item.coverImageUrl)
    .map((item) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.coverImageUrl as string,
    }));

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/35 to-white px-6 py-8 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.18)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.06),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-csv-orange/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Actualités</Badge>
              <Badge>Club</Badge>
              <Badge>Gazettes & événements</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Actualités du club
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-700 md:text-lg">
              Retrouvez les gazettes du week-end, les manifestations du club,
              les annonces importantes et les accès directs vers les réseaux
              officiels du CS Viriat.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={FACEBOOK_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Facebook
              </a>

              <a
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                Instagram (@cs_viriat)
              </a>
            </div>
          </div>
        </section>

        {/* Gazette */}
        <section className="mt-12 space-y-5">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
              Gazette
            </div>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">
              Gazette du club
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-700 md:text-base">
              Les éditions hebdomadaires du club avec résultats, visuels,
              réactions et temps forts du week-end.
            </p>
          </div>

          {gazettes.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-orange-200 bg-orange-50/50 p-6 text-sm text-neutral-700">
              Aucune gazette publiée pour le moment.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {gazettes.map((item) => {
                const href = item.fileUrl || item.externalUrl;

                return (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                  >
                    <div className="relative h-56 overflow-hidden border-b border-orange-100 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
                      {item.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.coverImageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/70">
                          <FileText size={36} />
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                          Gazette
                        </span>

                        {item.publishedAt ? (
                          <span className="text-xs font-semibold text-neutral-500">
                            {formatDate(item.publishedAt)}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-4 text-lg font-extrabold text-neutral-900">
                        {item.title}
                      </h3>

                      {item.excerpt ? (
                        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                          {item.excerpt}
                        </p>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-2">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                          >
                            Ouvrir
                            <ExternalLink size={15} />
                          </a>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-400">
                            Bientôt disponible
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Manifestations */}
        <section className="mt-12 space-y-5">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
              Manifestations
            </div>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">
              Agenda du club
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-700 md:text-base">
              Toutes les dates importantes du CS Viriat : tournois, repas,
              stages, animations, buvette, réunions et temps forts à venir.
            </p>
          </div>

          {manifestations.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-orange-200 bg-orange-50/50 p-6 text-sm text-neutral-700">
              Aucune manifestation publiée pour le moment.
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-orange-100 bg-white p-4 text-center shadow-sm">
                    <div className="text-2xl font-black text-orange-600">
                      {upcomingManifestations.length}
                    </div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                      à venir
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
                    <div className="text-2xl font-black text-neutral-900">
                      {pastManifestations.length}
                    </div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                      passés
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
                    <div className="text-2xl font-black text-neutral-900">
                      {manifestations.length}
                    </div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                      total
                    </div>
                  </div>
                </div>

                {highlightedManifestation ? (
                  <article className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-lg">
                    {highlightedManifestation.coverImageUrl ? (
                      <div className="border-b border-orange-100 bg-neutral-100">
                        <ImageLightboxTrigger
                          items={manifestationLightboxItems}
                          currentId={highlightedManifestation.id}
                          alt={highlightedManifestation.title}
                          className="h-auto w-full object-contain bg-neutral-100"
                        />
                      </div>
                    ) : null}

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          Prochaine manifestation
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600">
                          <CalendarDays size={14} />
                          {formatShortEventDate(highlightedManifestation.eventDate)}
                        </span>

                        {formatEventTime(highlightedManifestation.eventDate) ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600">
                            <Clock size={14} />
                            {formatEventTime(highlightedManifestation.eventDate)}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-4 text-lg font-extrabold text-neutral-900">
                        {highlightedManifestation.title}
                      </h3>

                      {highlightedManifestation.location ? (
                        <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                          <MapPin size={15} className="text-csv-orange" />
                          {highlightedManifestation.location}
                        </div>
                      ) : null}

                      {highlightedManifestation.excerpt ? (
                        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                          {highlightedManifestation.excerpt}
                        </p>
                      ) : null}

                      {highlightedManifestation.externalUrl ? (
                        <div className="mt-5">
                          <a
                            href={highlightedManifestation.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                          >
                            Voir plus
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ) : null}
              </div>

              <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-2 border-b border-neutral-100 pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-neutral-900">
                      Toutes les dates
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Une vue rapide pour ne manquer aucun temps fort du club.
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
                    Agenda
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {agendaManifestations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-5 text-sm text-neutral-700">
                      Les prochaines dates seront ajoutées ici dès publication.
                    </div>
                  ) : (
                    agendaManifestations.map((item) => {
                      const eventTime = formatEventTime(item.eventDate);

                      return (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 transition hover:border-orange-200 hover:bg-white hover:shadow-sm"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
                                  <CalendarDays size={13} />
                                  {formatShortEventDate(item.eventDate)}
                                </span>

                                {eventTime ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
                                    <Clock size={13} />
                                    {eventTime}
                                  </span>
                                ) : null}

                                {item.location ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
                                    <MapPin size={13} />
                                    {item.location}
                                  </span>
                                ) : null}
                              </div>

                              <h4 className="mt-3 text-base font-extrabold text-neutral-950">
                                {item.title}
                              </h4>

                              {item.excerpt ? (
                                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                                  {item.excerpt}
                                </p>
                              ) : null}
                            </div>

                            {item.externalUrl ? (
                              <a
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                              >
                                Voir
                                <ExternalLink size={14} />
                              </a>
                            ) : null}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Annonces */}
        <section className="mt-12 space-y-5">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">
              Annonces
            </div>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">
              Infos du club
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-700 md:text-base">
              Informations pratiques, annonces officielles et communications
              importantes.
            </p>
          </div>

          {annonces.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-orange-200 bg-orange-50/50 p-6 text-sm text-neutral-700">
              Aucune annonce publiée pour le moment.
            </div>
          ) : (
            <div className="flex max-w-md flex-col gap-8">
              {annonces.map((item) => {
                const externalHref = item.externalUrl;

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-lg"
                  >
                    {item.coverImageUrl ? (
                      <div className="border-b border-orange-100 bg-neutral-100">
                        <ImageLightboxTrigger
                          items={annonceLightboxItems}
                          currentId={item.id}
                          alt={item.title}
                          className="h-auto w-full object-contain bg-neutral-100"
                        />
                      </div>
                    ) : null}

                    <div className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-bold text-neutral-700">
                          <Megaphone size={14} />
                          {getTypeLabel(item.type)}
                        </span>

                        {item.publishedAt ? (
                          <span className="text-xs font-semibold text-neutral-500">
                            {formatDate(item.publishedAt)}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-4 text-lg font-extrabold text-neutral-900">
                        {item.title}
                      </h3>

                      {item.excerpt ? (
                        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                          {item.excerpt}
                        </p>
                      ) : null}

                      {externalHref ? (
                        <div className="mt-5">
                          <a
                            href={externalHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                          >
                            Voir plus
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
