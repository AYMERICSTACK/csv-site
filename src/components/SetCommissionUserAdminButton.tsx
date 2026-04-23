"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
  userId: string;
  userName: string;
  isCurrentAdmin: boolean;
};

export default function SetCommissionUserAdminButton({
  slug,
  userId,
  userName,
  isCurrentAdmin,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSetAdmin() {
    setError("");

    if (isCurrentAdmin) return;

    const confirmed = window.confirm(
      `Définir ${userName} comme admin de cette commission ?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/commissions/${slug}/users/${userId}/admin`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Impossible de définir cet admin.");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Une erreur est survenue.");
    }
  }

  if (isCurrentAdmin) {
    return (
      <div className="mt-3">
        <span className="inline-flex rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
          Admin de la commission
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleSetAdmin}
        disabled={isPending}
        className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Mise à jour..." : "Définir comme admin"}
      </button>

      {error ? (
        <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
