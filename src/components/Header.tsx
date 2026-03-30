"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { nav } from "@/data/navigation";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const transparentMode = isHome && !scrolled;

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

  // 🔥 bloque le scroll quand menu ouvert
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

            {/* Desktop nav */}
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
                Admin
              </Link>

              {/* Burger */}
              <button
                type="button"
                className={[
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-300 md:hidden",
                  transparentMode
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                    : "border-neutral-200 hover:bg-neutral-50",
                ].join(" ")}
                aria-label="Ouvrir le menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                <div className="flex flex-col gap-1">
                  <span
                    className={[
                      "h-0.5 w-5 transition-colors duration-300",
                      transparentMode ? "bg-white" : "bg-neutral-900",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "h-0.5 w-5 transition-colors duration-300",
                      transparentMode ? "bg-white" : "bg-neutral-900",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "h-0.5 w-5 transition-colors duration-300",
                      transparentMode ? "bg-white" : "bg-neutral-900",
                    ].join(" ")}
                  />
                </div>
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* 🔥 MENU MOBILE FIX GLOBAL (hors header) */}
      {open && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* panel */}
          <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-neutral-900">
                Menu
              </div>

              <button
                className="h-10 w-10 rounded-xl border border-neutral-200 hover:bg-neutral-50"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/admin/matchs"
                className="mt-4 rounded-xl border border-neutral-300 px-3 py-3 text-center text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                onClick={() => setOpen(false)}
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
