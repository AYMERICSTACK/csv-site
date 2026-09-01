"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCompetitionDefinition,
  getCompetitionsForTeam,
} from "@/lib/competitions";

type Props = {
  initialTeam: string;
  initialCompetitionKey?: string;
  initialCompetitionLabel?: string | null;
  initialRoundLabel?: string | null;
  targetTeamField?: string;
};

export default function CompetitionFields({
  initialTeam,
  initialCompetitionKey = "championship",
  initialCompetitionLabel,
  initialRoundLabel,
  targetTeamField = "team",
}: Props) {
  const [team, setTeam] = useState(initialTeam);
  const [competitionKey, setCompetitionKey] = useState(initialCompetitionKey);

  useEffect(() => {
    const teamInput = document.querySelector<HTMLSelectElement | HTMLInputElement>(
      `[name="${targetTeamField}"]`,
    );

    const syncTeam = () => setTeam(teamInput?.value || initialTeam);
    syncTeam();
    teamInput?.addEventListener("change", syncTeam);

    return () => teamInput?.removeEventListener("change", syncTeam);
  }, [initialTeam, targetTeamField]);

  const competitions = useMemo(() => getCompetitionsForTeam(team), [team]);

  useEffect(() => {
    if (!competitions.some((item) => item.key === competitionKey)) {
      setCompetitionKey("championship");
    }
  }, [competitionKey, competitions]);

  const selected = getCompetitionDefinition(competitionKey);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="label" htmlFor="competitionKey">
          Compétition
        </label>
        <select
          id="competitionKey"
          name="competitionKey"
          value={competitionKey}
          onChange={(event) => setCompetitionKey(event.target.value)}
          className="input"
          required
        >
          {competitions.map((competition) => (
            <option key={competition.key} value={competition.key}>
              {competition.label}
            </option>
          ))}
        </select>
      </div>

      {competitionKey === "other" ? (
        <div className="md:col-span-2">
          <label className="label" htmlFor="competitionCustomLabel">
            Nom de la compétition
          </label>
          <input
            id="competitionCustomLabel"
            name="competitionCustomLabel"
            defaultValue={
              initialCompetitionKey === "other" ? initialCompetitionLabel || "" : ""
            }
            className="input"
            placeholder="Ex : Tournoi de préparation"
            required
          />
        </div>
      ) : null}

      {selected?.type === "cup" ? (
        <div className="md:col-span-2">
          <label className="label" htmlFor="roundLabel">
            Tour (facultatif)
          </label>
          <input
            id="roundLabel"
            name="roundLabel"
            defaultValue={initialRoundLabel || ""}
            className="input"
            placeholder="Ex : 2e tour, 16e de finale..."
          />
        </div>
      ) : null}
    </div>
  );
}
