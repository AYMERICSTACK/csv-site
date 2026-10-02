import Container from "@/components/Container";

const INFO_URL = "https://www.e-cancer.fr/";

export default function PinkOctoberBanner() {
  return (
    <section
      aria-label="Octobre Rose"
      className="border-y border-pink-200 bg-gradient-to-r from-pink-50 via-white to-pink-50"
    >
      <Container>
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xl shadow-sm ring-1 ring-pink-200"
              aria-hidden="true"
            >
              🎀
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-pink-700">
                CS Viriat soutient Octobre Rose
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-neutral-700">
                Un mois de sensibilisation autour du cancer du sein, de la prévention et du dépistage.
              </p>
            </div>
          </div>

          <a
            href={INFO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-extrabold text-pink-700 transition hover:border-pink-300 hover:bg-pink-50"
          >
            S’informer
            <span className="ml-2" aria-hidden="true">→</span>
          </a>
        </div>
      </Container>
    </section>
  );
}
