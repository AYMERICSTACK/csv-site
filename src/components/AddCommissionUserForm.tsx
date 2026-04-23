"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type UserOption = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  slug: string;
  availableUsers: UserOption[];
};

export default function AddCommissionUserForm({ slug, availableUsers }: Props) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!selectedUserId) {
      setError("Sélectionne un utilisateur.");
      return;
    }

    try {
      const response = await fetch(`/api/commissions/${slug}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Impossible d’ajouter cet utilisateur.");
        return;
      }

      setSelectedUserId("");

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Une erreur est survenue.");
    }
  }

  if (availableUsers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
        Aucun utilisateur disponible à ajouter pour le moment.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="userId"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Ajouter un utilisateur avec accès
        </label>

        <select
          id="userId"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-orange-400"
          disabled={isPending}
        >
          <option value="">Sélectionner un utilisateur</option>
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} — {user.email}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Ajout..." : "Ajouter l’utilisateur"}
      </button>
    </form>
  );
}
