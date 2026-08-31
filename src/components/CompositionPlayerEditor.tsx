"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  positionSide: string | null;
  photoUrl: string | null;
  photoConsent: boolean | null;
};

type Props = {
  player: Player;
  action: (formData: FormData) => Promise<void>;
};

const POSITIONS = [
  { value: "GK", label: "Gardien" },
  { value: "DEF", label: "Défenseur" },
  { value: "MID", label: "Milieu" },
  { value: "ATT", label: "Attaquant" },
];

const ROLES_BY_POSITION: Record<string, { value: string; label: string }[]> = {
  GK: [],
  DEF: [
    { value: "DG", label: "Latéral gauche" },
    { value: "DC", label: "Défenseur central" },
    { value: "DD", label: "Latéral droit" },
  ],
  MID: [
    { value: "MDC", label: "Milieu défensif" },
    { value: "MC", label: "Milieu relayeur" },
    { value: "MOC", label: "Milieu offensif" },
  ],
  ATT: [
    { value: "AG", label: "Ailier gauche" },
    { value: "AD", label: "Ailier droit" },
    { value: "BU", label: "Avant-centre" },
  ],
};

const POSITION_LABELS: Record<string, string> = Object.fromEntries(
  POSITIONS.map((item) => [item.value, item.label]),
);

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(ROLES_BY_POSITION)
    .flat()
    .map((item) => [item.value, item.label]),
);

function initials(firstName: string, lastName: string) {
  return `${firstName[0] || ""}${lastName[0] || ""}`;
}

function formatCompositionName(player: Player) {
  const firstName = player.firstName.trim();
  const lastInitial = player.lastName.trim()[0];
  return lastInitial ? `${firstName}.${lastInitial.toUpperCase()}` : firstName;
}

export default function CompositionPlayerEditor({ player, action }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(player.position || "");
  const [positionSide, setPositionSide] = useState(player.positionSide || "");
  const [isPending, startTransition] = useTransition();

  const roles = useMemo(() => ROLES_BY_POSITION[position] || [], [position]);
  const fullName = `${player.firstName} ${player.lastName}`;
  const displayName = formatCompositionName(player);
  const positionLabel = player.position
    ? POSITION_LABELS[player.position] || player.position
    : "Poste non renseigné";
  const roleLabel = player.positionSide
    ? ROLE_LABELS[player.positionSide] || player.positionSide
    : null;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handlePositionChange(nextPosition: string) {
    setPosition(nextPosition);
    const validRoles = ROLES_BY_POSITION[nextPosition] || [];

    if (!validRoles.some((role) => role.value === positionSide)) {
      setPositionSide("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPosition(player.position || "");
          setPositionSide(player.positionSide || "");
          setOpen(true);
        }}
        className="group mx-auto grid h-[92px] w-full min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-white/20 bg-white/95 p-2 text-left text-neutral-950 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-orange-300/30"
        title={`Modifier le poste de ${fullName}`}
      >
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 text-xs font-black text-neutral-500">
          {player.photoConsent && player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            initials(player.firstName, player.lastName)
          )}
        </div>

        <div className="min-w-0 overflow-hidden">
          <div
            title={fullName}
            className="truncate text-[11px] font-black leading-tight tracking-tight text-neutral-950 sm:text-xs"
          >
            {displayName}
          </div>

          <div className="mt-1 space-y-0.5">
            <div className="truncate text-[9px] font-black leading-tight text-orange-700">
              {positionLabel}
            </div>

            {roleLabel ? (
              <div className="truncate text-[9px] font-black leading-tight text-neutral-700">
                {roleLabel}
              </div>
            ) : null}

            <div className="truncate text-[8px] font-bold leading-tight text-neutral-400 transition group-hover:text-orange-600">
              Cliquer pour modifier
            </div>
          </div>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white text-neutral-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5 sm:p-6">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                  Vue compo
                </div>
                <h3 className="mt-1 text-xl font-black">{fullName}</h3>
                <p className="mt-1 text-sm font-semibold text-neutral-500">
                  Modifiez son placement sans quitter le terrain.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xl font-black text-neutral-600 transition hover:bg-neutral-200"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <input type="hidden" name="playerId" value={player.id} />

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-neutral-500">
                  Poste principal
                </label>
                <select
                  name="position"
                  value={position}
                  onChange={(event) => handlePositionChange(event.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  required
                >
                  <option value="">Choisir un poste</option>
                  {POSITIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-neutral-500">
                  Rôle précis
                </label>
                {position === "GK" ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-500">
                    Gardien
                  </div>
                ) : (
                  <select
                    name="positionSide"
                    value={positionSide}
                    onChange={(event) => setPositionSide(event.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!position}
                    required={Boolean(position)}
                  >
                    <option value="">Choisir un rôle</option>
                    {roles.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                )}
                {position === "GK" ? (
                  <input type="hidden" name="positionSide" value="" />
                ) : null}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-csv-orange px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {isPending ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
