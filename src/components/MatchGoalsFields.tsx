"use client";

import { useMemo, useState } from "react";

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
  initialGoals?: MatchEventInput[];
  initialAssists?: MatchEventInput[];
};

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
      onChange={(e) => onChange(e.target.value)}
      className="input"
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

  const normalizeCategory = (value: string | null | undefined) =>
    String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const normalizedMatchTeam = normalizeCategory(matchTeam);
  const normalizedMatchCategory = normalizeCategory(matchCategory);

  const displayedPlayers = useMemo(() => {
    const sourcePlayers = showAllPlayers
      ? players
      : players.filter((player) => {
          const playerTeam = normalizeCategory(player.team);

          if (normalizedMatchTeam) {
            return playerTeam === normalizedMatchTeam;
          }

          const playerCategory = normalizeCategory(player.category);
          return playerCategory === normalizedMatchCategory;
        });

    return [...sourcePlayers].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
        "fr",
      ),
    );
  }, [players, showAllPlayers, normalizedMatchTeam, normalizedMatchCategory]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            checked={showAllPlayers}
            onChange={(event) => setShowAllPlayers(event.target.checked)}
          />
          Afficher tous les joueurs
        </label>

        <p className="mt-1 text-xs text-neutral-500">
          Par défaut, seuls les joueurs de l’équipe du match sont affichés.
          Active cette option si un joueur d’une autre équipe ou catégorie a
          participé.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
          <div className="text-sm font-extrabold text-neutral-900">
            ⚽ Buteurs
          </div>

          <div className="mt-3 space-y-3">
            {goals.map((goal, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-2xl border border-orange-100 bg-white p-3 md:grid-cols-[1fr_auto]"
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
                    setGoals((current) => current.filter((_, i) => i !== index))
                  }
                  className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-sm font-extrabold text-neutral-900">
            🎯 Passeurs
          </div>

          <div className="mt-3 space-y-3">
            {assists.map((assist, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-3 md:grid-cols-[1fr_auto]"
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
                      current.filter((_, i) => i !== index),
                    )
                  }
                  className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
