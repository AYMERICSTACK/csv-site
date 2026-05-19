"use client";

import { useEffect, useMemo, useState } from "react";

type PlayerOption = {
  id: string;
  firstName: string;
  lastName: string;
  team: string | null;
  category: string | null;
};

type MatchEventInput = {
  playerId: string;
};

type Props = {
  players: PlayerOption[];
  matchCategory?: string | null;
  matchTeam?: string | null;
  targetCategoryField?: string;
  targetTeamField?: string;
  initialGoals?: MatchEventInput[];
  initialAssists?: MatchEventInput[];
};

function normalize(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function PlayerSelect({
  name,
  value,
  players,
  onChange,
}: {
  name: string;
  value: string;
  players: PlayerOption[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
    >
      <option value="">Sélectionner un joueur</option>

      {players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.firstName} {player.lastName}
          {player.category ? ` — ${player.category}` : ""}
          {player.team ? ` / ${player.team}` : ""}
        </option>
      ))}
    </select>
  );
}

export default function MatchGoalsFields({
  players,
  matchCategory,
  matchTeam,
  targetCategoryField,
  targetTeamField,
  initialGoals = [],
  initialAssists = [],
}: Props) {
  const [goals, setGoals] = useState<MatchEventInput[]>(
    initialGoals.length > 0 ? initialGoals : [{ playerId: "" }],
  );

  const [assists, setAssists] = useState<MatchEventInput[]>(
    initialAssists.length > 0 ? initialAssists : [{ playerId: "" }],
  );

  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [liveCategory, setLiveCategory] = useState(matchCategory || "");
  const [liveTeam, setLiveTeam] = useState(matchTeam || "");

  useEffect(() => {
    if (!targetCategoryField && !targetTeamField) return;

    const readFormValues = () => {
      const categoryInput = targetCategoryField
        ? document.querySelector<HTMLSelectElement | HTMLInputElement>(
            `[name="${targetCategoryField}"]`,
          )
        : null;

      const teamInput = targetTeamField
        ? document.querySelector<HTMLSelectElement | HTMLInputElement>(
            `[name="${targetTeamField}"]`,
          )
        : null;

      setLiveCategory(categoryInput?.value || matchCategory || "");
      setLiveTeam(teamInput?.value || matchTeam || "");
    };

    readFormValues();

    const categoryInput = targetCategoryField
      ? document.querySelector<HTMLSelectElement | HTMLInputElement>(
          `[name="${targetCategoryField}"]`,
        )
      : null;

    const teamInput = targetTeamField
      ? document.querySelector<HTMLSelectElement | HTMLInputElement>(
          `[name="${targetTeamField}"]`,
        )
      : null;

    categoryInput?.addEventListener("change", readFormValues);
    teamInput?.addEventListener("change", readFormValues);

    return () => {
      categoryInput?.removeEventListener("change", readFormValues);
      teamInput?.removeEventListener("change", readFormValues);
    };
  }, [matchCategory, matchTeam, targetCategoryField, targetTeamField]);

  const normalizedMatchTeam = normalize(liveTeam);
  const normalizedMatchCategory = normalize(liveCategory);

  const displayedPlayers = useMemo(() => {
    const sourcePlayers = showAllPlayers
      ? players
      : players.filter((player) => {
          const playerTeam = normalize(player.team);

          if (normalizedMatchTeam) {
            return playerTeam === normalizedMatchTeam;
          }

          const playerCategory = normalize(player.category);
          return playerCategory === normalizedMatchCategory;
        });

    return [...sourcePlayers].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
        "fr",
      ),
    );
  }, [players, showAllPlayers, normalizedMatchTeam, normalizedMatchCategory]);

  const shouldSelectTeam =
    !showAllPlayers && !normalizedMatchTeam && !normalizedMatchCategory;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            checked={showAllPlayers}
            onChange={(event) => setShowAllPlayers(event.target.checked)}
          />
          Afficher tous les joueurs
        </label>

        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Par défaut, seuls les joueurs de l’équipe du match sont affichés.
          Active cette option si un joueur d’une autre équipe ou catégorie a
          participé.
        </p>
      </div>

      {shouldSelectTeam ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-4 text-xs font-semibold text-orange-700">
          Sélectionne une catégorie ou une équipe pour filtrer automatiquement
          les joueurs.
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="min-w-0 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
          <div className="text-sm font-extrabold text-neutral-900">
            ⚽ Buteurs
          </div>

          <div className="mt-3 space-y-3">
            {goals.map((goal, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-orange-100 bg-white p-3"
              >
                <PlayerSelect
                  name="goalPlayerId"
                  value={goal.playerId}
                  players={displayedPlayers}
                  onChange={(value) =>
                    setGoals((current) =>
                      current.map((item, i) =>
                        i === index ? { playerId: value } : item,
                      ),
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setGoals((current) =>
                      current.length > 1
                        ? current.filter((_, i) => i !== index)
                        : [{ playerId: "" }],
                    )
                  }
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setGoals((current) => [...current, { playerId: "" }])
            }
            className="mt-3 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
          >
            + Ajouter un buteur
          </button>
        </div>

        <div className="min-w-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-sm font-extrabold text-neutral-900">
            🎯 Passeurs
          </div>

          <div className="mt-3 space-y-3">
            {assists.map((assist, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-3"
              >
                <PlayerSelect
                  name="assistPlayerId"
                  value={assist.playerId}
                  players={displayedPlayers}
                  onChange={(value) =>
                    setAssists((current) =>
                      current.map((item, i) =>
                        i === index ? { playerId: value } : item,
                      ),
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setAssists((current) =>
                      current.length > 1
                        ? current.filter((_, i) => i !== index)
                        : [{ playerId: "" }],
                    )
                  }
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setAssists((current) => [...current, { playerId: "" }])
            }
            className="mt-3 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            + Ajouter un passeur
          </button>
        </div>
      </div>
    </div>
  );
}
