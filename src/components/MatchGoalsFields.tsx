"use client";

import { useState } from "react";

type Goal = {
  scorerName: string;
  goals: number;
};

export default function MatchGoalsFields({
  initialGoals,
}: {
  initialGoals: Goal[];
}) {
  const [goals, setGoals] = useState<Goal[]>(
    initialGoals.length > 0 ? initialGoals : [{ scorerName: "", goals: 1 }],
  );

  function updateGoal(index: number, field: keyof Goal, value: string) {
    setGoals((current) =>
      current.map((goal, i) =>
        i === index
          ? {
              ...goal,
              [field]:
                field === "goals" ? Math.max(1, Number(value || 1)) : value,
            }
          : goal,
      ),
    );
  }

  function addGoal() {
    setGoals((current) => [...current, { scorerName: "", goals: 1 }]);
  }

  function removeGoal(index: number) {
    setGoals((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {goals.map((goal, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 md:grid-cols-[1fr_110px_auto]"
        >
          <input
            name="goalScorerName"
            type="text"
            value={goal.scorerName}
            onChange={(e) => updateGoal(index, "scorerName", e.target.value)}
            placeholder="Nom du buteur"
            className="input"
          />

          <input
            name="goalCount"
            type="number"
            min="1"
            value={goal.goals}
            onChange={(e) => updateGoal(index, "goals", e.target.value)}
            className="input"
          />

          <button
            type="button"
            onClick={() => removeGoal(index)}
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Retirer
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addGoal}
        className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
      >
        + Ajouter un buteur
      </button>
    </div>
  );
}
