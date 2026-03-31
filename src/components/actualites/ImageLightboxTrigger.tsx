"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

type LightboxItem = {
  id: string;
  title: string;
  imageUrl: string;
};

type ImageLightboxTriggerProps = {
  items: LightboxItem[];
  currentId: string;
  alt: string;
  className?: string;
};

export default function ImageLightboxTrigger({
  items,
  currentId,
  alt,
  className = "h-auto w-full object-contain bg-neutral-100",
}: ImageLightboxTriggerProps) {
  const validItems = useMemo(
    () => items.filter((item) => item.imageUrl),
    [items],
  );

  const initialIndex = validItems.findIndex((item) => item.id === currentId);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const previewItem = initialIndex >= 0 ? validItems[initialIndex] : null;
  const activeItem = activeIndex !== null ? validItems[activeIndex] : null;

  if (!previewItem) return null;

  function open() {
    if (initialIndex >= 0) {
      setActiveIndex(initialIndex);
    }
  }

  function close() {
    setActiveIndex(null);
    setTouchStartX(null);
    setTouchEndX(null);
  }

  function goPrev() {
    if (activeIndex === null) return;

    setActiveIndex((prev) => {
      if (prev === null) return prev;
      return prev === 0 ? validItems.length - 1 : prev - 1;
    });
  }

  function goNext() {
    if (activeIndex === null) return;

    setActiveIndex((prev) => {
      if (prev === null) return prev;
      return prev === validItems.length - 1 ? 0 : prev + 1;
    });
  }

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0]?.clientX ?? null);
  }

  function onTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    setTouchEndX(e.targetTouches[0]?.clientX ?? null);
  }

  function onTouchEnd() {
    if (touchStartX === null || touchEndX === null) return;

    const distance = touchStartX - touchEndX;

    if (distance > 50) {
      goNext();
    } else if (distance < -50) {
      goPrev();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="group relative block w-full text-left"
        aria-label={`Agrandir ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewItem.imageUrl} alt={alt} className={className} />

        <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
          <Expand size={13} />
          Agrandir
        </div>
      </button>

      {activeItem ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-neutral-950/92 p-3 sm:p-6">
          <button
            type="button"
            aria-label="Fermer la galerie"
            onClick={close}
            className="absolute inset-0"
          />

          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-[301] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>

          {validItems.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 z-[301] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 md:inline-flex"
                aria-label="Image précédente"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 z-[301] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 md:inline-flex"
                aria-label="Image suivante"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}

          <div
            className="relative z-[301] flex max-h-[92vh] w-full max-w-5xl items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeItem.imageUrl}
              alt={activeItem.title}
              className="max-h-[92vh] w-auto max-w-full rounded-2xl object-contain shadow-[0_30px_90px_-30px_rgba(0,0,0,0.65)]"
            />
          </div>

          <div className="pointer-events-none absolute bottom-4 left-1/2 z-[301] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-center text-white backdrop-blur">
            <div className="text-sm font-bold">{activeItem.title}</div>
            {validItems.length > 1 ? (
              <div className="mt-1 text-xs text-white/70">
                Swipe sur mobile ou utilise les flèches
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
