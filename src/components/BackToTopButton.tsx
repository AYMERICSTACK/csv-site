"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOnFooter, setIsOnFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 420);

      const footer = document.querySelector("footer");

      if (!footer) {
        setIsOnFooter(false);
        return;
      }

      const footerTop = footer.getBoundingClientRect().top;
      const buttonTop = window.innerHeight - 140;

      setIsOnFooter(footerTop < buttonTop);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Retour en haut de page"
      className={`fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_18px_45px_-18px_rgba(0,0,0,0.65)] transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-orange-500/25 md:bottom-7 md:right-7 md:h-14 md:w-14 ${
        isOnFooter
          ? "border-neutral-200 bg-white text-neutral-950 hover:text-orange-600"
          : "border-neutral-950 bg-neutral-950 text-white hover:bg-orange-500"
      } ${
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
    </button>
  );
}
