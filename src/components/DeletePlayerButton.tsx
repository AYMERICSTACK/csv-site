"use client";

import { useState } from "react";

type DeletePlayerButtonProps = {
  playerId: string;
  firstName: string;
  lastName: string;
  deletePlayer: (formData: FormData) => void;
};

export default function DeletePlayerButton({
  playerId,
  firstName,
  lastName,
  deletePlayer,
}: DeletePlayerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
      >
        Supprimer
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-xl font-black text-neutral-950">
              Supprimer ce joueur ?
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Cette action supprimera définitivement{" "}
              <span className="font-bold text-neutral-950">
                {firstName} {lastName}
              </span>
              . Cette action est irréversible.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50"
              >
                Annuler
              </button>

              <form action={deletePlayer}>
                <input type="hidden" name="id" value={playerId} />

                <button
                  type="submit"
                  className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 sm:w-auto"
                >
                  Oui, supprimer
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
