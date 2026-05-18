"use client";

import { useMemo, useState } from "react";
import { CLUB_CATEGORIES } from "@/lib/categories";
import { CLUB_TEAMS } from "@/lib/teams";

type PlayerRow = {
  id: string;
  firstName: string;
  lastName: string;
  team: string | null;
  category: string | null;
  photoUrl: string | null;
  photoConsent: boolean;
  isActive: boolean;
  statId: string;
  goals: number;
  assists: number;
};

type Props = {
  season: string;
  players: PlayerRow[];
  createPlayer: (formData: FormData) => void | Promise<void>;
  updatePlayer: (formData: FormData) => void | Promise<void>;
  deletePlayer: (formData: FormData) => void | Promise<void>;
};

export default function AdminPlayersBoard({
  season,
  players,
  createPlayer,
  updatePlayer,
  deletePlayer,
}: Props) {
  const categories = useMemo(() => {
    const values = Array.from(
      new Set(players.map((p) => p.category || p.team || "Sans catégorie")),
    );

    return values.length ? values : ["Sans catégorie"];
  }, [players]);

  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const activePlayers = players.filter(
    (p) => (p.category || p.team || "Sans catégorie") === activeCategory,
  );

  const topScorers = [...activePlayers]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  const topAssists = [...activePlayers]
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 5);

  return (
    <div className="p-6 md:p-8">
      <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
              Administration
            </div>

            <h1 className="mt-2 text-3xl font-extrabold text-neutral-950">
              Joueurs & statistiques
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
              Gérez les joueurs par catégorie, les photos autorisées, les buts
              et les passes décisives pour la saison {season}.
            </p>
          </div>

          <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700">
            {players.length} joueur(s)
          </div>
        </div>

        <form
          action={createPlayer}
          className="mt-8 rounded-[1.5rem] border border-orange-100 bg-orange-50/30 p-5"
        >
          <h2 className="text-lg font-extrabold text-neutral-950">
            Ajouter un joueur
          </h2>

          <input type="hidden" name="season" value={season} />

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <input
              name="firstName"
              placeholder="Prénom"
              required
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-orange-300"
            />

            <input
              name="lastName"
              placeholder="Nom"
              required
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-orange-300"
            />

            <select
              name="team"
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-orange-300"
            >
              <option value="">Sélectionner une équipe</option>

              {CLUB_TEAMS.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>

            <select
              name="category"
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-orange-300"
            >
              <option value="">Sélectionner une catégorie</option>

              {CLUB_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              name="photoFile"
              type="file"
              accept="image/*"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
            />

            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700">
              <input type="checkbox" name="photoConsent" />
              Photo autorisée
            </label>
          </div>

          <button className="mt-5 rounded-xl bg-csv-black px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
            Ajouter le joueur
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => {
          const categoryPlayers = players.filter(
            (p) => (p.category || p.team || "Sans catégorie") === category,
          );

          const goals = categoryPlayers.reduce((sum, p) => sum + p.goals, 0);

          const assists = categoryPlayers.reduce(
            (sum, p) => sum + p.assists,
            0,
          );

          const isActive = category === activeCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                isActive
                  ? "border-orange-300 bg-orange-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                Catégorie
              </div>

              <div className="mt-1 text-2xl font-extrabold text-neutral-950">
                {category}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-700 shadow-sm">
                  {categoryPlayers.length} joueur(s)
                </span>

                <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  {goals} but(s)
                </span>

                <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  {assists} passe(s)
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-orange-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Catégorie sélectionnée
              </div>

              <h2 className="mt-1 text-2xl font-extrabold text-neutral-950">
                {activeCategory}
              </h2>
            </div>

            <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700">
              {activePlayers.length} joueur(s)
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {activePlayers.map((player) => (
              <form
                key={player.id}
                action={updatePlayer}
                className="rounded-[1.35rem] border border-neutral-200 bg-white p-4 transition hover:border-orange-200 hover:shadow-md"
              >
                <input type="hidden" name="id" value={player.id} />
                <input type="hidden" name="statId" value={player.statId} />
                <input type="hidden" name="season" value={season} />

                <input
                  type="hidden"
                  name="currentPhotoUrl"
                  value={player.photoUrl || ""}
                />

                <div className="grid gap-4 lg:grid-cols-[64px_1fr_120px]">
                  <div>
                    {player.photoConsent && player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={`${player.firstName} ${player.lastName}`}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-lg font-black text-neutral-500">
                        {player.firstName[0]}
                        {player.lastName[0]}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700">
                        {player.team || "Équipe non renseignée"}
                      </span>

                      <span
                        className={
                          player.photoConsent
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                            : "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700"
                        }
                      >
                        Photo{" "}
                        {player.photoConsent ? "autorisée" : "non autorisée"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-4">
                      <input
                        name="firstName"
                        defaultValue={player.firstName}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />

                      <input
                        name="lastName"
                        defaultValue={player.lastName}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />

                      <select
                        name="team"
                        defaultValue={player.team || ""}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      >
                        <option value="">Sélectionner une équipe</option>

                        {CLUB_TEAMS.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>

                      <select
                        name="category"
                        defaultValue={player.category || ""}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      >
                        <option value="">Sélectionner une catégorie</option>

                        {CLUB_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-2 grid gap-2 md:grid-cols-[1fr_90px_90px]">
                      <input
                        name="photoFile"
                        type="file"
                        accept="image/*"
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                      />

                      <input
                        name="goals"
                        type="number"
                        min="0"
                        defaultValue={player.goals}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />

                      <input
                        name="assists"
                        type="number"
                        min="0"
                        defaultValue={player.assists}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
                        <input
                          type="checkbox"
                          name="photoConsent"
                          defaultChecked={player.photoConsent}
                        />
                        Autorisation photo
                      </label>

                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={player.isActive}
                        />
                        Actif
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-orange-50 p-3 text-center">
                        <div className="text-xs font-bold uppercase text-orange-700">
                          Buts
                        </div>

                        <div className="text-xl font-black">{player.goals}</div>
                      </div>

                      <div className="rounded-2xl bg-neutral-100 p-3 text-center">
                        <div className="text-xs font-bold uppercase text-neutral-600">
                          Passes
                        </div>

                        <div className="text-xl font-black">
                          {player.assists}
                        </div>
                      </div>
                    </div>

                    <button className="rounded-xl bg-csv-orange px-4 py-2 text-sm font-bold text-white">
                      Enregistrer
                    </button>

                    <button
                      formAction={deletePlayer}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </form>
            ))}

            {!activePlayers.length && (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm font-semibold text-neutral-500">
                Aucun joueur dans cette catégorie.
              </div>
            )}
          </div>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-extrabold text-neutral-950">
              Classements {activeCategory}
            </h3>

            <div className="mt-5 rounded-2xl bg-orange-50 p-4">
              <div className="text-sm font-black uppercase tracking-wide text-orange-700">
                Top buteurs
              </div>

              <div className="mt-3 space-y-2">
                {topScorers.map((p, index) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-bold">
                      {index + 1}. {p.firstName} {p.lastName}
                    </span>

                    <span className="font-black text-orange-700">
                      {p.goals}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-neutral-100 p-4">
              <div className="text-sm font-black uppercase tracking-wide text-neutral-700">
                Top passeurs
              </div>

              <div className="mt-3 space-y-2">
                {topAssists.map((p, index) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-bold">
                      {index + 1}. {p.firstName} {p.lastName}
                    </span>

                    <span className="font-black text-neutral-900">
                      {p.assists}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
