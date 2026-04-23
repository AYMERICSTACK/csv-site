"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type StaffOption = {
  id: string;
  name: string;
  roleLabel: string;
  sectionTitle: string;
  commissionId: string | null;
};

type Props = {
  slug: string;
  availableMembers: StaffOption[];
};

export default function AddCommissionMemberForm({
  slug,
  availableMembers,
}: Props) {
  const router = useRouter();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!selectedMemberId) {
      setError("Sélectionne un membre.");
      return;
    }

    try {
      const response = await fetch(`/api/commissions/${slug}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: selectedMemberId,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data.error || "Impossible d’ajouter ce membre.");
        return;
      }

      setSelectedMemberId("");

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Une erreur est survenue.");
    }
  }

  if (availableMembers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
        Aucun membre disponible à ajouter pour le moment.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="memberId"
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          Choisir un membre existant
        </label>

        <select
          id="memberId"
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-orange-400"
          disabled={isPending}
        >
          <option value="">Sélectionner un membre</option>
          {availableMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} — {member.roleLabel}
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
        {isPending ? "Ajout..." : "Ajouter le membre"}
      </button>
    </form>
  );
}
