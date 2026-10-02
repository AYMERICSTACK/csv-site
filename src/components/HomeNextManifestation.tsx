import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, PartyPopper } from "lucide-react";

function eventParts(date: Date | string | null) {
  if (!date) return { day: "--", month: "À CONF.", label: "Date à confirmer", time: null };
  const parsed = new Date(date);
  const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "Europe/Paris" }).format(parsed);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Europe/Paris" }).format(parsed).replace(".", "").toUpperCase();
  const label = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(parsed);
  const parisTime = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Paris" }).format(parsed);
  const time = parisTime === "00:00" ? null : parisTime;
  return { day, month, label, time };
}

type Manifestation = {
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  eventDate: Date | null;
  location: string | null;
  externalUrl: string | null;
};

export default function HomeNextManifestation({ manifestations }: { manifestations: Manifestation[] }) {
  if (manifestations.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-white to-orange-50/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="rounded-[2.25rem] border border-orange-100 bg-white p-6 shadow-[0_28px_90px_-55px_rgba(0,0,0,0.45)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-700">
                <PartyPopper size={14} /> Agenda du club
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950">Prochaines manifestations</h2>
              <p className="mt-2 text-sm text-neutral-600">Les dates à retenir au CS Viriat, même avant la publication des affiches.</p>
            </div>
            <Link href="/actualites#manifestations" className="inline-flex items-center gap-2 text-sm font-black text-neutral-900 transition hover:text-csv-orange">
              Voir toutes les dates <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {manifestations.map((item, index) => {
              const parts = eventParts(item.eventDate);
              return (
                <article key={`${item.title}-${index}`} className="flex gap-4 rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:shadow-md">
                  <div className="flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-neutral-950 text-white">
                    <span className="text-2xl font-black leading-none">{parts.day}</span>
                    <span className="mt-1 text-[10px] font-black tracking-[0.12em] text-orange-400">{parts.month}</span>
                  </div>
                  <div className="min-w-0 py-1">
                    <h3 className="font-black leading-tight text-neutral-950">{item.title}</h3>
                    <div className="mt-2 space-y-1 text-xs font-semibold text-neutral-600">
                      <div className="flex items-center gap-1.5"><CalendarDays size={13} className="text-csv-orange" /><span className="capitalize">{parts.label}</span></div>
                      {parts.time ? <div className="flex items-center gap-1.5"><Clock size={13} className="text-csv-orange" />{parts.time}</div> : null}
                      {item.location ? <div className="flex items-center gap-1.5"><MapPin size={13} className="text-csv-orange" /><span className="truncate">{item.location}</span></div> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
