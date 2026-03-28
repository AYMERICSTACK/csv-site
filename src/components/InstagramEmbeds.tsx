"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type InstaPost = {
  url: string;
  label?: string; // ex: "Affiche du week-end"
};

export default function InstagramEmbeds({ posts }: { posts: InstaPost[] }) {
  const [ready, setReady] = useState(false);

  // Au cas où le script a déjà été chargé (navigation)
  useEffect(() => {
    // @ts-expect-error - injected by instagram
    if (window?.instgrm?.Embeds?.process) {
      // @ts-expect-error
      window.instgrm.Embeds.process();
      setReady(true);
    }
  }, []);

  return (
    <div>
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-expect-error - injected by instagram
          window?.instgrm?.Embeds?.process?.();
          setReady(true);
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <div
            key={p.url}
            className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-neutral-500">
                  INSTAGRAM
                </div>
                <div className="mt-1 text-sm font-extrabold text-neutral-900">
                  {p.label ?? "Publication"}
                </div>
              </div>

              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Voir
              </a>
            </div>

            <div className="mt-4">
              {/* Embed */}
              <blockquote
                className="instagram-media w-full"
                data-instgrm-permalink={p.url}
                data-instgrm-version="14"
                style={{
                  background: "white",
                  borderRadius: 16,
                  margin: 0,
                  width: "100%",
                }}
              />

              {/* Fallback si l’embed est lent / bloqué */}
              {!ready && (
                <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
                  Chargement de l’aperçu… si rien ne s’affiche, ouvre la
                  publication directement :
                  <div className="mt-2">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-csv-black px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Voir sur Instagram
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
