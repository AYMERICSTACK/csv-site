"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HomeCsvMag from "@/components/HomeCsvMag";
import { ChevronLeft, ChevronRight } from "lucide-react";

type FeaturedEvent = {
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  fileUrl: string | null;
  externalUrl: string | null;
};

export default function HomeFeaturedCarousel({ event }: { event: FeaturedEvent | null }) {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (!event) return;
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % 2), 7500);
    return () => window.clearInterval(timer);
  }, [event]);
  if (!event) return <HomeCsvMag />;
  return (
    <section aria-label="À la une du CSV" className="relative">
      {slide === 0 ? (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
          <div className="grid overflow-hidden rounded-[2.25rem] border border-orange-300 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white shadow-[0_30px_80px_-45px_rgba(0,0,0,0.75)] lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex min-h-[300px] items-center justify-center bg-neutral-900 p-6 md:min-h-[450px] md:p-8">
              <img src={event.coverImageUrl || "/bon-commande-huitres-2026.jpeg"} alt="Affiche de la manifestation" className="max-h-[450px] w-full rounded-xl object-contain" />
            </div>
            <div className="flex flex-col justify-center px-6 py-8 md:px-10 md:py-12 lg:px-14">
              <span className="w-fit rounded-full bg-orange-600 px-4 py-2 text-xs font-black uppercase tracking-widest">📌 À la une · 23 décembre 2026</span>
              <h2 className="mt-6 text-3xl font-black md:text-5xl">{event.title}</h2>
              <p className="mt-5 text-base leading-relaxed text-white/80">{event.excerpt || "Retrait des huîtres dès 18 h, soirée de Noël du CSV dès 19 h."}</p>
              <p className="mt-4 font-bold text-orange-300">34 € la bourriche de 3 douzaines · Commandes avant le 20 décembre</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={event.externalUrl || "/commandes-huitres"} className="rounded-2xl bg-orange-600 px-5 py-3.5 text-sm font-black text-white hover:bg-orange-500">🦪 Commander en ligne</Link>
                {event.fileUrl && <a href={event.fileUrl} download className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-black text-white hover:bg-white/20">Télécharger le bulletin</a>}
              </div>
            </div>
          </div>
        </div>
      ) : <HomeCsvMag />}
      <div className="flex items-center justify-center gap-4 pb-4">
        <button type="button" onClick={() => setSlide((slide + 1) % 2)} aria-label="Diapositive précédente" className="rounded-full border border-neutral-300 p-2 hover:bg-orange-50"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => setSlide(0)} aria-label="Voir la manifestation" aria-current={slide === 0 ? "true" : undefined} className={`h-2.5 rounded-full transition-all ${slide === 0 ? "w-8 bg-orange-600" : "w-2.5 bg-neutral-300"}`} />
        <button type="button" onClick={() => setSlide(1)} aria-label="Voir le CSVMAG" aria-current={slide === 1 ? "true" : undefined} className={`h-2.5 rounded-full transition-all ${slide === 1 ? "w-8 bg-orange-600" : "w-2.5 bg-neutral-300"}`} />
        <button type="button" onClick={() => setSlide((slide + 1) % 2)} aria-label="Diapositive suivante" className="rounded-full border border-neutral-300 p-2 hover:bg-orange-50"><ChevronRight size={18} /></button>
      </div>
    </section>
  );
}
