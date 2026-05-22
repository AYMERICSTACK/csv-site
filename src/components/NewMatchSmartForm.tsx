"use client";

import { useEffect, useState } from "react";
import { CLUB_CATEGORIES } from "@/lib/categories";
import { CLUB_TEAMS } from "@/lib/teams";

type Props = {
  favoriteTeam?: string;
};

function getNextMatchDateForTeam(team: string) {
  const rules = [
    { includes: "Vétérans", day: 5, hour: 21, minute: 0 },
    { includes: "Seniors 1", day: 6, hour: 18, minute: 30 },
    { includes: "Seniors", day: 0, hour: 15, minute: 0 },
    { includes: "U20", day: null, hour: null, minute: null },
    { includes: "U17", day: 6, hour: 15, minute: 30 },
    { includes: "U15", day: 0, hour: 15, minute: 0 },
    { includes: "U13", day: 6, hour: 13, minute: 30 },
  ];

  const rule = rules.find((rule) => team.includes(rule.includes));

  if (
    !rule ||
    rule.day === null ||
    rule.hour === null ||
    rule.minute === null
  ) {
    return "";
  }

  const date = new Date();

  const diff = (rule.day - date.getDay() + 7) % 7 || 7;

  date.setDate(date.getDate() + diff);
  date.setHours(rule.hour, rule.minute, 0, 0);

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getCategoryFromTeam(team: string) {
  return (
    CLUB_CATEGORIES.find((category) =>
      team.toLowerCase().includes(category.toLowerCase()),
    ) ?? ""
  );
}

export default function NewMatchSmartForm({ favoriteTeam = "" }: Props) {
  const [team, setTeam] = useState(favoriteTeam);

  const [category, setCategory] = useState(getCategoryFromTeam(favoriteTeam));

  const [matchDate, setMatchDate] = useState(
    getNextMatchDateForTeam(favoriteTeam),
  );

  useEffect(() => {
    setCategory(getCategoryFromTeam(team));
    setMatchDate(getNextMatchDateForTeam(team));
  }, [team]);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <label htmlFor="category" className="label">
          Catégorie
        </label>

        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input"
          required
        >
          <option value="">Sélectionner une catégorie</option>

          {CLUB_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="team" className="label">
          Équipe
        </label>

        <select
          id="team"
          name="team"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="input"
          required
        >
          <option value="">Sélectionner une équipe</option>

          {CLUB_TEAMS.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="matchDate" className="label">
          Date et heure
        </label>

        <input
          id="matchDate"
          name="matchDate"
          type="datetime-local"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          className="input"
          required
        />
      </div>
    </div>
  );
}
