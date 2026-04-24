"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@/components/Container";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus("error");
        setError(data?.error || "Impossible d’envoyer le lien.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setError("Une erreur est survenue.");
    }
  }

  return (
    <Container>
      <div className="flex min-h-[75vh] items-center justify-center py-12">
        <section className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-xl">
          <div className="bg-neutral-950 px-6 py-8 text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-orange-300">
              Accès club
            </p>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
              Définir mon mot de passe
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Indique ton email. Si un compte existe, tu recevras un lien
              sécurisé pour choisir ton mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-neutral-800"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton.email@exemple.fr"
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400"
              />
            </div>

            {status === "success" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Si un compte correspond à cet email, un lien vient d’être
                envoyé.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Envoi en cours..." : "Recevoir le lien"}
            </button>

            <div className="text-center">
              <Link
                href="/admin/login"
                className="text-sm font-semibold text-neutral-600 transition hover:text-orange-600"
              >
                Retour à la connexion
              </Link>
            </div>
          </form>
        </section>
      </div>
    </Container>
  );
}
