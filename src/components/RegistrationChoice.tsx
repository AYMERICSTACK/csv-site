"use client";

import { useState } from "react";
import HelloAssoWidget from "@/components/HelloAssoWidget";

type Props = {
  seasonLabel: string;
  helloAssoLicencesUrl: string;
  helloAssoWidgetUrl: string;
};

export default function RegistrationChoice({
  seasonLabel,
  helloAssoLicencesUrl,
  helloAssoWidgetUrl,
}: Props) {
  const [choice, setChoice] = useState<"renewal" | "new" | null>(null);

  return (
    <section className="mt-12 overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_24px_80px_-45px_rgba(0,0,0,0.35)]">
      <div className="p-6 md:p-8">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
            {seasonLabel}
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-950">
            Quelle démarche souhaitez-vous faire ?
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-neutral-600 md:text-base">
            Sélectionnez votre situation afin d’accéder uniquement aux bonnes
            informations.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setChoice("renewal")}
            className="group text-left rounded-[1.75rem] border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="inline-flex rounded-full bg-csv-orange px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
              Déjà licencié au CSV
            </div>

            <h3 className="mt-4 text-2xl font-extrabold text-neutral-950">
              Je renouvelle ma licence
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Accéder au formulaire HelloAsso pour renouveler votre licence
              2026/2027.
            </p>

            <div className="mt-5 inline-flex rounded-xl bg-csv-black px-4 py-2 text-sm font-bold text-white">
              Accéder au renouvellement
            </div>
          </button>

          <button
            type="button"
            onClick={() => setChoice("new")}
            className="group text-left rounded-[1.75rem] border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
          >
            <div className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-neutral-700">
              Nouveau au club
            </div>

            <h3 className="mt-4 text-2xl font-extrabold text-neutral-950">
              Je souhaite m’inscrire
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Consulter les documents utiles et contacter le club avant toute
              démarche.
            </p>

            <div className="mt-5 inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-900">
              Préparer mon inscription
            </div>
          </button>
        </div>
      </div>

      {choice === "renewal" && (
        <div className="border-t border-orange-100 bg-orange-50/25 p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h3 className="text-2xl font-extrabold text-neutral-950">
                Renouvellement de licence
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Cette démarche est réservée uniquement aux joueurs et joueuses
                déjà licenciés au CS Viriat la saison précédente.
              </p>

              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="text-sm font-extrabold uppercase tracking-wide text-red-700">
                  Information importante
                </div>

                <h4 className="mt-2 text-lg font-extrabold text-red-900">
                  HelloAsso = renouvellement uniquement
                </h4>

                <p className="mt-2 text-sm leading-relaxed text-red-800">
                  Pour une première licence ou une arrivée au club, merci de ne
                  pas passer par HelloAsso.
                </p>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-orange-100 bg-white p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-csv-orange text-lg font-black text-white">
                  QR
                </div>

                <h4 className="mt-4 text-lg font-extrabold text-neutral-900">
                  QR code renouvellement
                </h4>

                <img
                  src="/inscriptions/qr-licences-2026-2027.png"
                  alt="QR code licences 2026/2027 CS Viriat"
                  className="mx-auto mt-5 h-auto w-full max-w-[220px] rounded-2xl border border-white bg-white p-2 shadow-sm"
                />

                <a
                  href={helloAssoLicencesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white"
                >
                  Ouvrir le renouvellement
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-orange-100 bg-white shadow-sm">
              <div className="border-b border-orange-100 bg-white px-5 py-4">
                <h4 className="text-sm font-extrabold text-neutral-900">
                  Formulaire HelloAsso intégré
                </h4>
              </div>

              <div className="min-h-[720px] bg-white">
                <HelloAssoWidget src={helloAssoWidgetUrl} />
              </div>
            </div>
          </div>
        </div>
      )}

      {choice === "new" && (
        <div className="border-t border-orange-100 bg-orange-50/25 p-6 md:p-8">
          <h3 className="text-2xl font-extrabold text-neutral-950">
            Nouvelle inscription
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
            Pour une première licence ou une arrivée au CS Viriat, merci de
            consulter les documents utiles puis de contacter le club avant toute
            démarche en ligne.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#nouvelle-inscription"
              className="inline-flex rounded-xl bg-csv-orange px-5 py-3 text-sm font-extrabold text-white"
            >
              Voir les documents
            </a>

            <a
              href="/contact"
              className="inline-flex rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-900"
            >
              Contacter le club
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
