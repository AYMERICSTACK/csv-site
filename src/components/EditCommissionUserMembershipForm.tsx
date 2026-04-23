"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
  userId: string;
  initialRoleLabel: string | null;
  initialIsVisibleInCommission: boolean;
};

export default function EditCommissionUserMembershipForm({
  slug,
  userId,
  initialRoleLabel,
  initialIsVisibleInCommission,
}: Props) {
  const router = useRouter();
  const [roleLabel, setRoleLabel] = useState(initialRoleLabel || "");
  const [isVisibleInCommission, setIsVisibleInCommission] = useState(
    initialIsVisibleInCommission,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/commissions/${slug}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleLabel,
          isVisibleInCommission,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Impossible de mettre à jour ce membre.");
        return;
      }

      setSuccess("Mise à jour effectuée.");

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Une erreur est survenue.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Rôle dans la commission
        </label>
        <input
          type="text"
          value={roleLabel}
          onChange={(e) => setRoleLabel(e.target.value)}
          placeholder="Ex : Président, Référent, Bénévole..."
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-orange-400"
          disabled={isPending}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={isVisibleInCommission}
          onChange={(e) => setIsVisibleInCommission(e.target.checked)}
          disabled={isPending}
        />
        Visible dans la liste des membres
      </label>

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm font-medium text-emerald-600">{success}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
