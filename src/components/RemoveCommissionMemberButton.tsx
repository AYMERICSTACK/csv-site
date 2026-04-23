"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
  memberId: string;
  memberName: string;
};

export default function RemoveCommissionMemberButton({
  slug,
  memberId,
  memberName,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleRemove() {
    setError("");

    const confirmed = window.confirm(
      `Retirer ${memberName} de cette commission ?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/commissions/${slug}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Impossible de retirer ce membre.");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Une erreur est survenue.");
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Retrait..." : "Retirer de la commission"}
      </button>

      {error ? (
        <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
