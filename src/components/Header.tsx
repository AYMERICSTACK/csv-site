"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { nav } from "@/data/navigation";

const mobileNavSections = [
  {
    title: "Navigation",
    links: nav.filter((item) =>
      ["/", "/club", "/inscriptions", "/actualites"].includes(item.href),
    ),
  },
  {
    title: "Sportif",
    links: nav.filter((item) =>
      ["/equipes", "/club/staff", "/calendrier", "/classements"].includes(
        item.href,
      ),
    ),
  },
  {
    title: "Infos pratiques",
    links: nav.filter((item) => ["/partenaires", "/contact"].includes(item.href)),
  },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const transparentMode = isHome && !scrolled && !open;

  const isActive = useMemo(
    () => (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };

    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
          transparentMode
            ? "border-white/10 bg-transparent"
            : "border-neutral-200 bg-white/90 shadow-sm backdrop-blur",
        ].join(" ")}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setOpen(false)}
            >
              <Image
                src={
                  transparentMode
                    ? "/logo-csv-blanc.svg"
                    : "/logo-csv-couleur-noir.svg"
                }
                alt="Logo CS Viriat"
                width={56}
                height={56}
                className="object-contain transition-all duration-300 hover:scale-105"
                priority
              />
            </Link>

            <nav className="hidden items-center gap-5 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "text-sm font-medium transition-colors duration-300",
                    transparentMode
                      ? "text-white/85 hover:text-white"
                      : "text-neutral-700 hover:text-neutral-900",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/login"
                className={[
                  "hidden rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-300 md:inline-flex",
                  transparentMode
                    ? "border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15"
                    : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
                ].join(" ")}
              >
                Espace club
              </Link>

              <button
                type="button"
                className={[
                  "inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 active:scale-95 md:hidden",
                  transparentMode
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                    : "border-neutral-200 bg-white text-neutral-950 shadow-sm hover:bg-neutral-50",
                ].join(" ")}
                aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                <div className="flex flex-col gap-1.5">
                  <span
                    className={[
                      "h-0.5 w-5 rounded-full transition-colors duration-300",
                      transparentMode ? "bg-white" : "bg-neutral-900",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "h-0.5 w-5 rounded-full transition-colors duration-300",
                      transparentMode ? "bg-white" : "bg-neutral-900",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "h-0.5 w-5 rounded-full transition-colors duration-300",
                      transparentMode ? "bg-white" : "bg-neutral-900",
                    ].join(" ")}
                  />
                </div>
              </button>
            </div>
          </div>
        </Container>
      </header>

      {open && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute inset-y-0 right-0 flex h-[100dvh] w-[88%] max-w-sm flex-col overflow-hidden rounded-l-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">
                  CS Viriat
                </p>
                <p className="mt-1 text-xl font-extrabold tracking-tight text-neutral-950">
                  Menu
                </p>
              </div>

              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-2xl leading-none text-neutral-900 shadow-sm transition active:scale-95 hover:bg-neutral-50"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              <div className="space-y-6">
                {mobileNavSections.map((section) => (
                  <div key={section.title}>
                    <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-neutral-400">
                      {section.title}
                    </p>

                    <div className="space-y-1.5">
                      {section.links.map((item) => {
                        const active = isActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={[
                              "flex min-h-12 items-center rounded-2xl px-4 py-3 text-base font-extrabold transition active:scale-[0.98]",
                              active
                                ? "bg-neutral-950 text-white shadow-lg shadow-neutral-950/10"
                                : "text-neutral-800 hover:bg-neutral-50",
                            ].join(" ")}
                            onClick={() => setOpen(false)}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 bg-white/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur">
              <Link
                href="/admin/login"
                className="flex min-h-14 items-center justify-center rounded-2xl bg-neutral-950 px-4 py-4 text-center text-base font-extrabold text-white shadow-xl shadow-neutral-950/15 transition active:scale-[0.98]"
                onClick={() => setOpen(false)}
              >
                Espace club
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
