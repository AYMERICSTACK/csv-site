import Container from "@/components/Container";

const INFO_URL = "https://www.e-cancer.fr/";

export default function PinkOctoberBanner() {
  return (
    <section
      aria-label="Octobre Rose"
      className="border-y border-pink-200 bg-gradient-to-r from-pink-50 via-white to-pink-50"
    >
      <Container>
        <div className="flex items-center gap-2 py-2 sm:gap-3 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-base shadow-sm ring-1 ring-pink-200 sm:h-10 sm:w-10 sm:text-xl"
              aria-hidden="true"
            >
              🎀
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase leading-tight tracking-[0.06em] text-pink-700 sm:text-sm sm:tracking-[0.08em]">
                CS Viriat soutient Octobre Rose
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-700 sm:text-sm sm:leading-relaxed">
                <span className="sm:hidden">Prévention &amp; dépistage du cancer du sein.</span>
                <span className="hidden sm:inline">
                  Un mois de sensibilisation autour du cancer du sein, de la prévention et du dépistage.
                </span>
              </p>
            </div>
          </div>

          <a
            href={INFO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg border border-pink-200 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-pink-700 transition hover:border-pink-300 hover:bg-pink-50 sm:min-h-10 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="sm:hidden">Infos</span>
            <span className="hidden sm:inline">S’informer</span>
            <span className="ml-1.5 sm:ml-2" aria-hidden="true">→</span>
          </a>
        </div>
      </Container>
    </section>
  );
}
