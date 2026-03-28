"use client";

import Container from "@/components/Container";
import { site } from "@/data/site";
import { useState } from "react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      firstName: String(formData.get("firstName") || ""),
      lastName: String(formData.get("lastName") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      subject: String(formData.get("subject") || ""),
      message: String(formData.get("message") || ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Une erreur est survenue.");
      }

      setSuccess(true);
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d’envoyer le message.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <section className="py-14 md:py-20">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-csv-orange/20 bg-csv-orange px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white">
            Contact
          </span>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-neutral-900 md:text-5xl">
            Entrer en contact avec le club
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            Une question sur les inscriptions, les équipes, l’organisation du
            club ou les partenariats ? Notre équipe est à votre écoute et vous
            répondra dans les meilleurs délais.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-neutral-400">
                Club
              </div>
              <h2 className="mt-3 text-2xl font-extrabold text-neutral-900">
                {site.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {site.slogan}
              </p>

              <div className="mt-6 h-1 w-16 rounded-full bg-csv-orange" />

              <div className="mt-6 space-y-4 text-sm text-neutral-700">
                <div>
                  <div className="font-semibold text-neutral-900">Ville</div>
                  <div className="mt-1">{site.city}</div>
                </div>

                <div>
                  <div className="font-semibold text-neutral-900">Email</div>
                  <a
                    className="mt-1 inline-block underline underline-offset-4 transition hover:text-csv-orange"
                    href={`mailto:${site.email}`}
                  >
                    {site.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="text-sm font-bold text-neutral-900">
                  Inscriptions
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Pour toute question sur les tarifs, dossiers ou modalités
                  d’inscription.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="text-sm font-bold text-neutral-900">
                  Informations club
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Pour contacter le club au sujet des équipes, horaires,
                  organisation ou événements.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Formulaire
                </div>
                <h2 className="mt-2 text-2xl font-extrabold text-neutral-900">
                  Envoyer un message
                </h2>
              </div>

              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-csv-orange text-lg font-extrabold text-white sm:flex">
                @
              </div>
            </div>

            {success && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                Message envoyé avec succès ✅
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-semibold text-neutral-800"
                  >
                    Prénom
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Votre prénom"
                    required
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-semibold text-neutral-800"
                  >
                    Nom
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Votre nom"
                    required
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-neutral-800"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@email.com"
                    required
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-neutral-800"
                  >
                    Téléphone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    pattern="[0-9\s+]+"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-semibold text-neutral-800"
                >
                  Sujet
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Objet de votre message"
                  required
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-neutral-800"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Votre message..."
                  required
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-neutral-500">
                  En envoyant ce formulaire, vous acceptez d’être recontacté par
                  le club.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-csv-orange px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Envoi en cours..." : "Envoyer le message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Container>
  );
}
