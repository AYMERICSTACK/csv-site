import Container from "@/components/Container";
import Badge from "@/components/Badge";
import ImageLightboxTrigger from "@/components/actualites/ImageLightboxTrigger";
import { prisma } from "@/lib/prisma";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MapPin,
  Megaphone,
  Newspaper,
  Sparkles,
} from "lucide-react";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/CSViriat.football";
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/cs_viriat/";

function formatDate(date: Date | string | null) {
  if (!date) return "Date à confirmer";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortEventDate(date: Date | string | null) {
  if (!date) return "À confirmer";

  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
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
  timeZone: "Europe/Paris",
  });
}

function getPrimaryHref(item: {
  fileUrl: string | null;
  externalUrl: string | null;
}) {
  return item.fileUrl || item.externalUrl;
}

export default async function ActualitesPage() {
  const items = await prisma.newsItem.findMany({
    where: { isPublished: true },
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
  const upcomingManifestations = manifestations
    .filter((item) => !item.eventDate || new Date(item.eventDate) >= now)
    .sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
  const pastManifestations = manifestations
    .filter((item) => item.eventDate && new Date(item.eventDate) < now)
    .sort(
      (a, b) =>
        new Date(b.eventDate as Date).getTime() -
        new Date(a.eventDate as Date).getTime(),
    );
  const agendaManifestations = [
    ...upcomingManifestations,
    ...pastManifestations,
  ];
  const highlightedManifestation =
    upcomingManifestations[0] || pastManifestations[0];
  const latestGazette = gazettes[0];

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
        <section className="relative overflow-hidden rounded-[2.25rem] border border-orange-100 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black px-6 py-8 text-white shadow-[0_30px_90px_-45px_rgba(0,0,0,0.65)] md:px-10 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_30%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Actualités</Badge>
                <Badge>CS Viriat</Badge>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">
                Actualités du CSV
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/75 md:text-lg">
                Gazettes, manifestations, annonces importantes et réseaux
                officiels : retrouvez rapidement les dernières informations du
                CS Viriat.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#gazettes"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-csv-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <Newspaper size={16} />
                  Voir les gazettes
                </a>
                <a
                  href="#manifestations"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  <CalendarDays size={16} />
                  Prochaines dates
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                [gazettes.length, "Gazettes"],
                [manifestations.length, "Manifestations"],
                [annonces.length, "Infos club"],
              ].map(([count, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
                >
                  <div className="text-3xl font-black">{count}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <a
            href="#gazettes"
            className="group rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
          >
            <FileText className="text-csv-orange" size={22} />
            <h2 className="mt-3 text-lg font-black text-neutral-950">
              Gazettes
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              Résultats, photos, supports PDF et temps forts du week-end.
            </p>
          </a>
          <a
            href="#manifestations"
            className="group rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
          >
            <CalendarDays className="text-blue-600" size={22} />
            <h2 className="mt-3 text-lg font-black text-neutral-950">
              Manifestations
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              Repas, tournois, stages, réunions et rendez-vous importants.
            </p>
          </a>
          <a
            href="#infos"
            className="group rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <Megaphone className="text-neutral-800" size={22} />
            <h2 className="mt-3 text-lg font-black text-neutral-950">
              Infos club
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              Communications rapides, liens utiles et annonces officielles.
            </p>
          </a>
        </section>

        <section id="gazettes" className="mt-14">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-700">
                Gazette
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950">
                Gazette du club
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
                Les supports à consulter ou partager après les temps forts du
                club.
              </p>
            </div>
            {latestGazette ? (
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">
                Dernière publication : {formatDate(latestGazette.publishedAt)}
              </span>
            ) : null}
          </div>

          {gazettes.length === 0 ? (
            <div className="mt-6 rounded-[1.75rem] border border-dashed border-orange-200 bg-orange-50/50 p-6 text-sm text-neutral-700">
              Aucune gazette publiée pour le moment.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {gazettes.map((item, index) => {
                const href = getPrimaryHref(item);

                return (
                  <article
                    key={item.id}
                    className={`group overflow-hidden rounded-[2rem] border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                      index === 0
                        ? "border-orange-200 ring-4 ring-orange-50"
                        : "border-orange-100"
                    }`}
                  >
                    <div className="relative h-60 overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
                      {item.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.coverImageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/70">
                          <FileText size={42} />
                        </div>
                      )}
                      {index === 0 ? (
                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-csv-orange px-3 py-1 text-xs font-black text-white shadow-lg">
                          <Sparkles size={13} />
                          Dernière gazette
                        </div>
                      ) : null}
                    </div>
                    <div className="p-5">
                      <div className="text-xs font-bold text-neutral-500">
                        {formatDate(item.publishedAt || item.createdAt)}
                      </div>
                      <h3 className="mt-2 text-xl font-black text-neutral-950">
                        {item.title}
                      </h3>
                      {item.excerpt ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                          {item.excerpt}
                        </p>
                      ) : null}
                      <div className="mt-5">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-csv-black px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                          >
                            Ouvrir la gazette
                            <ExternalLink size={15} />
                          </a>
                        ) : (
                          <span className="inline-flex rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-bold text-neutral-400">
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

        <section id="manifestations" className="mt-16">
          <div>
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
              Manifestations
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950">
              Les prochains rendez-vous
            </h2>
          </div>

          {manifestations.length === 0 ? (
            <div className="mt-6 rounded-[1.75rem] border border-dashed border-blue-200 bg-blue-50/50 p-6 text-sm text-neutral-700">
              Aucune manifestation publiée pour le moment.
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              {highlightedManifestation ? (
                <article className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm">
                  {highlightedManifestation.coverImageUrl ? (
                    <div className="bg-neutral-100">
                      <ImageLightboxTrigger
                        items={manifestationLightboxItems}
                        currentId={highlightedManifestation.id}
                        alt={highlightedManifestation.title}
                        className="h-auto w-full object-contain bg-neutral-100"
                      />
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 text-blue-600">
                      <ImageIcon size={44} />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      <CalendarDays size={14} />À ne pas manquer
                    </span>
                    <h3 className="mt-3 text-2xl font-black text-neutral-950">
                      {highlightedManifestation.title}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-neutral-700">
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1">
                        <CalendarDays size={13} />
                        {formatShortEventDate(
                          highlightedManifestation.eventDate,
                        )}
                      </span>
                      {formatEventTime(highlightedManifestation.eventDate) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1">
                          <Clock size={13} />
                          {formatEventTime(highlightedManifestation.eventDate)}
                        </span>
                      ) : null}
                      {highlightedManifestation.location ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1">
                          <MapPin size={13} />
                          {highlightedManifestation.location}
                        </span>
                      ) : null}
                    </div>
                    {highlightedManifestation.excerpt ? (
                      <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                        {highlightedManifestation.excerpt}
                      </p>
                    ) : null}
                    {highlightedManifestation.externalUrl ? (
                      <a
                        href={highlightedManifestation.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-csv-black px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                      >
                        Voir plus
                        <ExternalLink size={15} />
                      </a>
                    ) : null}
                  </div>
                </article>
              ) : null}

              <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-5">
                  <div>
                    <h3 className="text-xl font-black text-neutral-950">
                      Agenda
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Toutes les dates, même sans affiche.
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                    {agendaManifestations.length} date(s)
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {agendaManifestations.map((item) => {
                    const eventTime = formatEventTime(item.eventDate);
                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2 text-xs font-bold text-neutral-700">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-neutral-200">
                                <CalendarDays size={13} />
                                {formatShortEventDate(item.eventDate)}
                              </span>
                              {eventTime ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-neutral-200">
                                  <Clock size={13} />
                                  {eventTime}
                                </span>
                              ) : null}
                            </div>
                            <h4 className="mt-3 font-black text-neutral-950">
                              {item.title}
                            </h4>
                            {item.location ? (
                              <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-neutral-600">
                                <MapPin size={14} className="text-csv-orange" />
                                {item.location}
                              </p>
                            ) : null}
                            {item.excerpt ? (
                              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                                {item.excerpt}
                              </p>
                            ) : null}
                          </div>
                          {item.externalUrl ? (
                            <a
                              href={item.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-neutral-800 transition hover:bg-neutral-50"
                            >
                              Voir
                              <ExternalLink size={14} />
                            </a>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        <section id="infos" className="mt-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-700">
                Infos club
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950">
                Annonces importantes
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
                Les communications utiles à garder sous la main.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={FACEBOOK_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-800 transition hover:bg-neutral-50"
              >
                Facebook
              </a>
              <a
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-800 transition hover:bg-neutral-50"
              >
                Instagram
              </a>
            </div>
          </div>

          {annonces.length === 0 ? (
            <div className="mt-6 rounded-[1.75rem] border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700">
              Aucune annonce publiée pour le moment.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {annonces.map((item) => {
                const href = getPrimaryHref(item);
                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    {item.coverImageUrl ? (
                      <div className="border-b border-neutral-100 bg-neutral-100">
                        <ImageLightboxTrigger
                          items={annonceLightboxItems}
                          currentId={item.id}
                          alt={item.title}
                          className="h-auto w-full object-contain bg-neutral-100"
                        />
                      </div>
                    ) : null}
                    <div className="p-6">
                      <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
                        <Megaphone size={14} />
                        Info club
                      </span>
                      <h3 className="mt-4 text-xl font-black text-neutral-950">
                        {item.title}
                      </h3>
                      {item.excerpt ? (
                        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-neutral-600">
                          {item.excerpt}
                        </p>
                      ) : null}
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Voir plus
                          <ExternalLink size={15} />
                        </a>
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
