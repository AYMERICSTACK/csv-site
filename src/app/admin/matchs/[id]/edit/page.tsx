"use client";

import Container from "@/components/Container";
import Badge from "@/components/Badge";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Match = {
  id: string;
  category: string;
  team: string;
  opponent: string;
  matchDate: string;
  location: string;
  isHome: boolean;
  status: string;
  scoreTeam: number | null;
  scoreOpponent: number | null;
  scorers: string | null;
};

function formatDateTimeLocal(dateString: string) {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditMatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    category: "",
    team: "",
    opponent: "",
    matchDate: "",
    location: "",
    isHome: true,
    status: "scheduled",
    scoreTeam: "",
    scoreOpponent: "",
    scorers: "",
  });

  useEffect(() => {
    async function fetchMatch() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/matches/${params.id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Impossible de charger le match.");
        }

        const data: Match = await res.json();

        setForm({
          category: data.category,
          team: data.team,
          opponent: data.opponent,
          matchDate: formatDateTimeLocal(data.matchDate),
          location: data.location,
          isHome: data.isHome,
          status: data.status,
          scoreTeam: data.scoreTeam !== null ? String(data.scoreTeam) : "",
          scoreOpponent:
            data.scoreOpponent !== null ? String(data.scoreOpponent) : "",
          scorers: data.scorers ?? "",
        });
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement du match.");
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      fetchMatch();
    }
  }, [params?.id]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "isHome" ? value === "true" : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const res = await fetch(`/api/matches/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour.");
      }

      router.push("/admin/matchs");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="py-14">
          <p className="text-sm text-neutral-600">Chargement du match...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-14">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Admin</Badge>
            <Badge>Matchs</Badge>
            <Badge>Édition</Badge>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
            Modifier un match
          </h1>

          <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
            Mets à jour les informations du match puis enregistre les
            modifications.
          </p>
        </div>

        <div className="mt-10 max-w-3xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-neutral-900"
              >
                Catégorie
              </label>
              <input
                id="category"
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                required
              />
            </div>

            <div>
              <label
                htmlFor="team"
                className="mb-2 block text-sm font-semibold text-neutral-900"
              >
                Équipe
              </label>
              <input
                id="team"
                name="team"
                type="text"
                value={form.team}
                onChange={handleChange}
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                required
              />
            </div>

            <div>
              <label
                htmlFor="opponent"
                className="mb-2 block text-sm font-semibold text-neutral-900"
              >
                Adversaire
              </label>
              <input
                id="opponent"
                name="opponent"
                type="text"
                value={form.opponent}
                onChange={handleChange}
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                required
              />
            </div>

            <div>
              <label
                htmlFor="matchDate"
                className="mb-2 block text-sm font-semibold text-neutral-900"
              >
                Date et heure
              </label>
              <input
                id="matchDate"
                name="matchDate"
                type="datetime-local"
                value={form.matchDate}
                onChange={handleChange}
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                required
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-semibold text-neutral-900"
              >
                Lieu
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                required
              />
            </div>

            <div>
              <label
                htmlFor="isHome"
                className="mb-2 block text-sm font-semibold text-neutral-900"
              >
                Type de rencontre
              </label>
              <select
                id="isHome"
                name="isHome"
                value={String(form.isHome)}
                onChange={handleChange}
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
              >
                <option value="true">Domicile</option>
                <option value="false">Extérieur</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-semibold text-neutral-900"
              >
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
              >
                <option value="scheduled">Programmé</option>
                <option value="postponed">Reporté</option>
                <option value="cancelled">Annulé</option>
                <option value="finished">Terminé</option>
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="scoreTeam"
                  className="mb-2 block text-sm font-semibold text-neutral-900"
                >
                  Score CS Viriat
                </label>
                <input
                  id="scoreTeam"
                  name="scoreTeam"
                  type="number"
                  min="0"
                  value={form.scoreTeam}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreOpponent"
                  className="mb-2 block text-sm font-semibold text-neutral-900"
                >
                  Score adversaire
                </label>
                <input
                  id="scoreOpponent"
                  name="scoreOpponent"
                  type="number"
                  min="0"
                  value={form.scoreOpponent}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="scorers"
                className="mb-2 block text-sm font-semibold text-neutral-900"
              >
                Buteurs
              </label>
              <textarea
                id="scorers"
                name="scorers"
                value={form.scorers}
                onChange={handleChange}
                rows={3}
                placeholder="Ex : Martin x2, Dupont ou Martin (12e), Dupont (57e)"
                className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Format libre pour cette V1 : Martin x2, Dupont / CSC / Martin
                (12e).
              </p>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-csv-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/matchs")}
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </Container>
  );
}
