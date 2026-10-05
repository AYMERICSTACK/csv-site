import Link from "next/link";
import Container from "@/components/Container";
import { LATEST_CSVMAG } from "@/data/csvmag";
import { ArrowRight, BookOpen, ExternalLink, Newspaper } from "lucide-react";

export default function HomeCsvMag() {
  const issue = LATEST_CSVMAG;

  return (
    <section className="py-8 md:py-12">
      <Container>
        <div className="overflow-hidden rounded-[2.25rem] border border-orange-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black shadow-[0_30px_80px_-45px_rgba(0,0,0,0.75)]">
          <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
            <div className="relative min-h-[360px] bg-neutral-900 p-6 md:min-h-[500px] md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,122,0,0.22),transparent_45%)]" />
              <img
                src={issue.coverUrl}
                alt={`Couverture CSVMAG n°${issue.number}`}
                className="relative mx-auto h-full max-h-[460px] w-auto rounded-xl object-contain shadow-2xl"
              />
            </div>

            <div className="relative flex flex-col justify-center px-6 py-8 text-white md:px-10 md:py-12 lg:px-14">
              <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-csv-orange/10 blur-3xl" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-csv-orange px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white">
                    <Newspaper size={14} /> À la une
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">
                    CSVMAG #{issue.number}
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">
                  {issue.title}
                </h2>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-csv-orange">
                  {issue.period}
                </p>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
                  {issue.excerpt}
                </p>
                <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-white">
                  {issue.highlights}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={issue.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-csv-orange px-5 py-3.5 text-sm font-black text-white transition hover:opacity-90"
                  >
                    <BookOpen size={17} /> Lire le magazine <ExternalLink size={15} />
                  </a>
                  <Link
                    href="/actualites#csvmag"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    Voir les numéros <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
