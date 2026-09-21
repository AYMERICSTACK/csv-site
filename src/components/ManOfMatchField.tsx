"use client";

import { useEffect, useMemo, useState } from "react";
import { Medal } from "lucide-react";
import { formatPlayerName } from "@/lib/person-select";

type PlayerOption = {
  id: string;
  firstName: string;
  lastName: string;
  team: string | null;
  photoUrl: string | null;
  photoConsent: boolean;
};

type Props = {
  team: string;
  players: PlayerOption[];
  initialPlayerId?: string | null;
};

function readNumber(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  if (!(field instanceof HTMLInputElement) || field.value.trim() === "") return null;
  const value = Number(field.value);
  return Number.isFinite(value) ? value : null;
}

function isCsvVictory(form: HTMLFormElement) {
  const team = readNumber(form, "scoreTeam");
  const opponent = readNumber(form, "scoreOpponent");
  if (team === null || opponent === null) return false;
  if (team > opponent) return true;
  if (team < opponent) return false;

  const penaltyTeam = readNumber(form, "penaltyScoreTeam");
  const penaltyOpponent = readNumber(form, "penaltyScoreOpponent");
  return penaltyTeam !== null && penaltyOpponent !== null && penaltyTeam > penaltyOpponent;
}

export default function ManOfMatchField({ team, players, initialPlayerId = null }: Props) {
  const eligibleTeam = team === "Seniors 1" || team === "Seniors 2";
  const [isVictory, setIsVictory] = useState(false);

  const teamPlayers = useMemo(
    () =>
      players
        .filter((player) => player.team === team)
        .sort((a, b) =>
          formatPlayerName(a.firstName, a.lastName).localeCompare(
            formatPlayerName(b.firstName, b.lastName),
            "fr",
            { sensitivity: "base" },
          ),
        ),
    [players, team],
  );

  useEffect(() => {
    if (!eligibleTeam) return;
    const field = document.querySelector<HTMLInputElement>('input[name="scoreTeam"]');
    const form = field?.form;
    if (!form) return;

    const refresh = () => setIsVictory(isCsvVictory(form));
    refresh();
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    return () => {
      form.removeEventListener("input", refresh);
      form.removeEventListener("change", refresh);
    };
  }, [eligibleTeam]);

  if (!eligibleTeam) return null;

  if (!isVictory) {
    return (
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3">
          <Medal className="mt-0.5 shrink-0 text-neutral-400" size={20} />
          <div>
            <div className="text-sm font-black text-neutral-800">Homme du match</div>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-neutral-500">
              Le choix sera proposé dès qu’une victoire de {team} est saisie.
            </p>
          </div>
        </div>
        <input type="hidden" name="manOfMatchPlayerId" value="" />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <Medal className="mt-0.5 shrink-0 text-orange-600" size={20} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-neutral-950">🏅 Homme du match</div>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-neutral-600">
            Facultatif. Sélectionne le joueur élu après la victoire.
          </p>
          <select
            name="manOfMatchPlayerId"
            defaultValue={initialPlayerId ?? ""}
            className="mt-3 w-full rounded-xl border border-orange-200 bg-white px-3 py-3 text-sm font-bold text-neutral-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          >
            <option value="">Aucun pour le moment</option>
            {teamPlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {formatPlayerName(player.firstName, player.lastName)}
              </option>
            ))}
          </select>
          {teamPlayers.length === 0 ? (
            <p className="mt-2 text-xs font-bold text-red-600">Aucun joueur actif trouvé pour {team}.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
