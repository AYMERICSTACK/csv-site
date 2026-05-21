import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  PartyPopper,
} from "lucide-react";

function formatEventDate(date: Date | string | null) {
  if (!date) return "Date à confirmer";

  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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

type HomeNextManifestationProps = {
  manifestation: {
    title: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    eventDate: Date | null;
    location: string | null;
    externalUrl: string | null;
  } | null;
};

export default function HomeNextManifestation({
  manifestation,
}: HomeNextManifestationProps) {
  if (!manifestation) return null;

  const eventTime = formatEventTime(manifestation.eventDate);

  return (
    <section className="bg-gradient-to-b from-white to-orange-50/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="overflow-hidden rounded-[2.25rem] border border-orange-100 bg-white shadow-[0_28px_90px_-55px_rgba(0,0,0,0.45)]">
          <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative min-h-[280px] overflow-hidden bg-neutral-950 lg:min-h-full">
              {manifestation.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={manifestation.coverImageUrl}
                  alt={manifestation.title}
                  className="h-full min-h-[280px] w-full object-cover transition duration-500 hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white/55">
                  <ImageIcon size={52} />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-csv-orange px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg">
                <PartyPopper size={15} />
                Prochaine manifestation
              </div>
            </div>

            <div className="relative p-6 md:p-8 lg:p-10">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-orange-50" />

              <div className="relative">
                <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-700">
                  Agenda du club
                </span>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-neutral-950 md:text-4xl">
                  {manifestation.title}
                </h2>

                {manifestation.excerpt ? (
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
                    {manifestation.excerpt}
                  </p>
                ) : (
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
                    Le prochain rendez-vous du CS Viriat à ne pas manquer.
                  </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <CalendarDays className="text-csv-orange" size={19} />
                    <div className="mt-2 text-sm font-black capitalize text-neutral-950">
                      {formatEventDate(manifestation.eventDate)}
                    </div>
                  </div>

                  {eventTime ? (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <Clock className="text-csv-orange" size={19} />
                      <div className="mt-2 text-sm font-black text-neutral-950">
                        {eventTime}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <MapPin className="text-csv-orange" size={19} />
                    <div className="mt-2 text-sm font-black text-neutral-950">
                      {manifestation.location || "Lieu à confirmer"}
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  {manifestation.externalUrl ? (
                    <a
                      href={manifestation.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-csv-orange px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
                    >
                      Voir plus
                      <ExternalLink size={16} />
                    </a>
                  ) : null}

                  <Link
                    href="/actualites#manifestations"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-black text-neutral-900 transition hover:bg-neutral-50"
                  >
                    Voir l’agenda
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
