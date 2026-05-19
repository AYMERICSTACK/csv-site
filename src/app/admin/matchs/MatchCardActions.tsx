"use client";

import Link from "next/link";
import { SquarePen, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type MatchCardActionsProps = {
  matchId: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      title="Supprimer le match"
      disabled={pending}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={16} />
    </button>
  );
}

export default function MatchCardActions({
  matchId,
  deleteAction,
}: MatchCardActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/matchs/${matchId}/edit`}
        title="Modifier le match"
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white text-neutral-800 transition hover:bg-neutral-100"
      >
        <SquarePen size={16} />
      </Link>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          const confirmed = window.confirm(
            "Voulez-vous vraiment supprimer ce match ?",
          );

          if (!confirmed) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={matchId} />
        <DeleteButton />
      </form>
    </div>
  );
}
