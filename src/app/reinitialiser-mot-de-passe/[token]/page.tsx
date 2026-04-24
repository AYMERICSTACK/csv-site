"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ResetPasswordPage({ params }: PageProps) {
  const { token } = await params;

  return <ResetPasswordForm token={token} />;
}

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "success") {
      const timeout = setTimeout(() => {
        router.push("/admin/login");
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setStatus("error");
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus("error");
        setError(data?.error || "Impossible de modifier le mot de passe.");
        return;
      }

      setStatus("success");
      setPassword("");
      setPasswordConfirm("");
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
              Nouveau mot de passe
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Choisis un mot de passe sécurisé pour accéder à ton espace club.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400"
              />
            </div>

            {status === "success" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Mot de passe défini avec succès. Redirection vers la
                connexion...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            {status === "success" ? (
              <Link
                href="/admin/login"
                className="block w-full rounded-2xl bg-orange-500 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Aller à la connexion
              </Link>
            ) : (
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "loading"
                  ? "Modification..."
                  : "Définir mon mot de passe"}
              </button>
            )}
          </form>
        </section>
      </div>
    </Container>
  );
}
