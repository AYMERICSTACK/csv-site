import Container from "./Container";
import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/site";
import { nav } from "@/data/navigation";

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/10 bg-[#111111] text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-csv-orange to-transparent opacity-70" />

      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr]">
          {/* Bloc identité */}
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <Image
                  src="/logo-csv-couleur.svg"
                  alt="Logo CS Viriat"
                  width={42}
                  height={42}
                  className="object-contain"
                />
              </div>

              <div>
                <div className="text-lg font-extrabold tracking-tight text-white">
                  {site.name}
                </div>
                <div className="text-sm text-white/55">Club de football</div>
              </div>
            </div>

            <div className="mt-5 h-1 w-16 rounded-full bg-csv-orange" />

            <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
              {site.slogan}
            </p>

            <div className="mt-6 space-y-2 text-sm text-white/65">
              <div>{site.city}</div>
              <a
                href={`mailto:${site.email}`}
                className="inline-block transition-colors hover:text-white"
              >
                {site.email}
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/inscriptions"
                className="inline-flex items-center rounded-xl bg-csv-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                S&apos;inscrire
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Nous contacter
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
              Navigation
            </div>

            <div className="mt-5 grid gap-3">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-white/75 transition-colors hover:text-csv-orange"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Infos utiles */}
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
              Infos utiles
            </div>

            <div className="mt-5 grid gap-3">
              <Link
                href="/inscriptions"
                className="text-sm font-medium text-white/75 transition-colors hover:text-csv-orange"
              >
                Inscriptions
              </Link>
              <Link
                href="/calendrier"
                className="text-sm font-medium text-white/75 transition-colors hover:text-csv-orange"
              >
                Calendrier
              </Link>
              <Link
                href="/actualites"
                className="text-sm font-medium text-white/75 transition-colors hover:text-csv-orange"
              >
                Actualités
              </Link>
              <Link
                href="/partenaires"
                className="text-sm font-medium text-white/75 transition-colors hover:text-csv-orange"
              >
                Partenaires
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-white/75 transition-colors hover:text-csv-orange"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-5 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} {site.name}. Tous droits réservés.
          </div>
          <div>Unis par nos couleurs, montrons nos valeurs.</div>
        </div>
      </Container>
    </footer>
  );
}
