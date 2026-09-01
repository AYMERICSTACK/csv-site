"use client";

import { useState } from "react";

type Props = {
  initialTeam?: number | null;
  initialOpponent?: number | null;
};

export default function PenaltyFields({ initialTeam, initialOpponent }: Props) {
  const [enabled, setEnabled] = useState(
    initialTeam !== null && initialTeam !== undefined &&
      initialOpponent !== null && initialOpponent !== undefined,
  );

  return (
    <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <label className="flex items-center gap-2 text-sm font-black text-violet-900">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Séance de tirs au but
      </label>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-violet-700">
        Active uniquement si le match de coupe est à égalité et se décide aux tirs au but. Les tirs au but ne comptent pas dans les statistiques des buteurs.
      </p>

      {enabled ? (
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <label>
            <span className="mb-2 block text-center text-xs font-black uppercase text-violet-700">CSV</span>
            <input
              name="penaltyScoreTeam"
              type="number"
              min="0"
              inputMode="numeric"
              defaultValue={initialTeam ?? ""}
              className="input text-center"
              required
            />
          </label>
          <div className="pb-3 font-black text-violet-300">–</div>
          <label>
            <span className="mb-2 block text-center text-xs font-black uppercase text-violet-700">ADV.</span>
            <input
              name="penaltyScoreOpponent"
              type="number"
              min="0"
              inputMode="numeric"
              defaultValue={initialOpponent ?? ""}
              className="input text-center"
              required
            />
          </label>
        </div>
      ) : (
        <>
          <input type="hidden" name="penaltyScoreTeam" value="" />
          <input type="hidden" name="penaltyScoreOpponent" value="" />
        </>
      )}
    </div>
  );
}
