import Image from "next/image";
import Container from "@/components/Container";
import { site } from "@/data/site";

const valueCards = [
  {
    title: "Solidarité & engagement",
    image: "/club/solidarite-engagement.png",
  },
  {
    title: "Respect & tolérance",
    image: "/club/respect-tolerance.png",
  },
  {
    title: "Formation",
    image: "/club/formation.png",
  },
  {
    title: "Convivialité",
    image: "/club/convivialite.png",
  },
];

const clubStats = [
  {
    value: "1931",
    label: "année de création",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path
          fill="currentColor"
          d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm12 6H5v12h14V8Z"
        />
      </svg>
    ),
  },
  {
    value: "450",
    label: "licenciés",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path
          fill="currentColor"
          d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11Zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Zm0 2c-2.67 0-8 1.34-8 4v3h10v-3c0-1.66.83-2.97 2.34-3.86C11.12 12.42 9.6 13 8 13Zm8 0c-.29 0-.62.02-.97.05C17.16 13.86 18 15.14 18 17v3h6v-3c0-2.66-5.33-4-8-4Z"
        />
      </svg>
    ),
  },
  {
    value: "22",
    label: "équipes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path
          fill="currentColor"
          d="M12 2 2 7l10 5 10-5-10-5Zm0 7L2 14l10 5 10-5-10-5Z"
        />
      </svg>
    ),
  },
  {
    value: "40+",
    label: "éducateurs",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="currentColor" d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3Z" />
      </svg>
    ),
  },
  {
    value: "40+",
    label: "bénévoles",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path
          fill="currentColor"
          d="M12 21s-6-4.35-9-8.5C1.5 9.36 3.36 6 7 6c2.04 0 3.13 1.2 5 3 1.87-1.8 2.96-3 5-3 3.64 0 5.5 3.36 4 6.5C18 16.65 12 21 12 21Z"
        />
      </svg>
    ),
  },
];

const historyItems = [
  {
    year: "1931",
    text: "Création du club à Viriat avec la volonté de rassembler la jeunesse du village autour du sport et de la camaraderie.",
  },
  {
    year: "1949",
    text: "Le club prend son nom actuel : Club Sportif de Viriat (CSV).",
  },
  {
    year: "1983",
    text: "Le stade des Baisses devient le Stade Pierre Brichon.",
  },
  {
    year: "Aujourd’hui",
    text: "Le CSV poursuit son développement avec 450 licenciés, un encadrement structuré et une identité forte autour de ses valeurs.",
  },
];

export default function ClubPage() {
  return (
    <Container>
      <div className="py-14">
        {/* Intro */}
        <section className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/35 to-white px-6 py-8 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.18)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.06),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-csv-orange/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
              Le club
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Le CS Viriat, bien plus qu’un club
            </h1>

            <p className="mt-4 text-base leading-relaxed text-neutral-700 md:text-lg">
              {site.slogan}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-neutral-600 md:text-base">
              Le CSV s’appuie sur des valeurs fortes qui guident la vie du club,
              l’encadrement des joueurs et l’esprit collectif au quotidien.
            </p>
          </div>
        </section>

        {/* Visuel principal */}
        <div className="mt-10 flex justify-center">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
            <Image
              src="/club/valeurs-globales.png"
              alt="Nos valeurs au CS Viriat"
              width={1600}
              height={900}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>

        {/* Cartes valeurs */}
        <div className="mt-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">
              Nos valeurs
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700 md:text-base">
              Retrouvez les grands principes qui structurent l’identité du club.
            </p>
          </div>

          <div className="mx-auto mt-6 grid max-w-3xl gap-6 md:grid-cols-2">
            {valueCards.map((card) => (
              <article
                key={card.title}
                className="group overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              >
                <div className="overflow-hidden p-4">
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={1600}
                    height={900}
                    className="mx-auto h-auto w-full max-w-[420px] transition duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Bloc complémentaire haut */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-neutral-900">
              Unis par nos couleurs, montrons nos valeurs
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-neutral-700 md:text-base">
              Le club souhaite transmettre bien plus que la pratique du football
              : un état d’esprit, un sens du collectif et une manière de
              représenter fièrement les couleurs du CSV.
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-orange-100">
              <Image
                src="/club/unis-par-nos-couleurs.png"
                alt="Unis par nos couleurs, montrons nos valeurs"
                width={1600}
                height={900}
                className="h-auto w-full"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-neutral-900">
              Le club en chiffres
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-neutral-700 md:text-base">
              Plus de 90 ans d’histoire, un club formateur et une communauté
              engagée.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {clubStats.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/25 p-4 transition hover:border-orange-200 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-csv-orange/10 text-csv-orange">
                    {item.icon}
                  </div>

                  <div>
                    <div className="text-lg font-extrabold text-neutral-900">
                      {item.value}
                    </div>
                    <div className="text-xs text-neutral-600">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Histoire */}
        <div className="mt-6 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-neutral-900">
            Notre histoire
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-700 md:text-base">
            Depuis 1931, le CS Viriat s’inscrit dans la vie locale avec une
            ambition simple : rassembler, former et faire vivre le sport dans un
            esprit de camaraderie et d’engagement.
          </p>

          <div className="mt-8 space-y-6">
            {historyItems.map((item, index) => (
              <div
                key={item.year}
                className="grid gap-3 md:grid-cols-[120px_24px_1fr]"
              >
                <div className="text-sm font-extrabold text-csv-orange md:pt-1">
                  {item.year}
                </div>

                <div className="relative flex justify-center">
                  {index !== historyItems.length - 1 && (
                    <div className="absolute bottom-[-24px] top-3 w-px bg-orange-100" />
                  )}
                  <div className="relative mt-1 h-3 w-3 rounded-full bg-csv-orange ring-4 ring-csv-orange/10" />
                </div>

                <div>
                  <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-white to-orange-50/25 p-4">
                    <p className="text-sm leading-relaxed text-neutral-700">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
