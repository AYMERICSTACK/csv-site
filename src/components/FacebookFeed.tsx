"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function FacebookFeed({ pageUrl }: { pageUrl: string }) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Si Facebook ne rend rien rapidement, on bascule sur fallback
    const t = window.setTimeout(() => setShowFallback(true), 7000);
    return () => window.clearTimeout(t);
  }, []);

  if (showFallback) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
        <div className="text-sm font-extrabold text-neutral-900">
          Accéder aux actus Facebook
        </div>
        <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
          Le flux Facebook peut être bloqué par les paramètres de
          confidentialité, les cookies ou un bloqueur de publicité. Vous pouvez
          consulter les publications directement sur la page officielle.
        </p>
        <div className="mt-4">
          <a
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Voir la page Facebook
          </a>
        </div>
        <div className="mt-3 text-xs text-neutral-500">
          Astuce : autoriser les cookies tiers / désactiver AdBlock peut
          permettre l’affichage du flux.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div id="fb-root" />

      <Script
        id="facebook-jssdk"
        strategy="afterInteractive"
        src="https://connect.facebook.net/fr_FR/sdk.js#xfbml=1&version=v19.0"
        onLoad={() => {
          (window as any).FB?.XFBML?.parse?.();
        }}
      />

      <div
        className="fb-page"
        data-href={pageUrl}
        data-tabs="timeline"
        data-width=""
        data-height="800"
        data-small-header="false"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="true"
      />
    </div>
  );
}
