"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type CommissionOption = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  commissions: CommissionOption[];
};

export default function InternalSignupForm({ commissions }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>(
    [],
  );

  function toggleCommission(commissionId: string) {
    setSelectedCommissionIds((current) =>
      current.includes(commissionId)
        ? current.filter((id) => id !== commissionId)
        : [...current, commissionId],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (selectedCommissionIds.length === 0) {
      setError("Sélectionne au moins une commission.");
      return;
    }

    formData.delete("commissionIds");
    selectedCommissionIds.forEach((id) => {
      formData.append("commissionIds", id);
    });

    try {
      const response = await fetch("/api/internal-signup", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Impossible d’envoyer la demande.");
        return;
      }

      setSuccess(
        "Ta demande a bien été envoyée. Un administrateur doit maintenant activer ton compte.",
      );

      form.reset();
      setSelectedCommissionIds([]);

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Une erreur est survenue.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-semibold text-neutral-900"
        >
          Nom complet
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Ex : Yohan Martin"
          className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-orange-400"
          disabled={isPending}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-neutral-900"
        >
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="Ex : yohan@email.fr"
          className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-orange-400"
          disabled={isPending}
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-sm font-semibold text-neutral-900"
        >
          Téléphone
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          placeholder="Ex : 06 12 34 56 78"
          className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-orange-400"
          disabled={isPending}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-neutral-900"
        >
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="8 caractères minimum"
          className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-orange-400"
          disabled={isPending}
        />
      </div>

      <div>
        <p className="mb-3 block text-sm font-semibold text-neutral-900">
          Commission(s) demandée(s)
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {commissions.map((commission) => {
            const checked = selectedCommissionIds.includes(commission.id);

            return (
              <label
                key={commission.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                  checked
                    ? "border-orange-300 bg-orange-50"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCommission(commission.id)}
                  disabled={isPending}
                  className="mt-1"
                />

                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {commission.name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {commission.slug}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="signupNote"
          className="mb-2 block text-sm font-semibold text-neutral-900"
        >
          Autre besoin ou précision
        </label>
        <textarea
          id="signupNote"
          name="signupNote"
          rows={4}
          placeholder="Ex : Je ne trouve pas ma commission / J’ai aussi besoin d’un accès arbitrage / Je suis entraîneur U15..."
          className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-orange-400"
          disabled={isPending}
        />
        <p className="mt-2 text-xs text-neutral-500">
          Ce champ n’ajoute pas automatiquement une commission. Il sert à
          préciser ta demande à l’administrateur.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-2xl bg-csv-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Envoi..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
