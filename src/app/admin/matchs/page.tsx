import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function parseLocalDateTime(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

async function createMatch(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "admin") {
    redirect("/espace-club/profil");
  }

  const category = String(formData.get("category") || "").trim();
  const team = String(formData.get("team") || "").trim();
  const opponent = String(formData.get("opponent") || "").trim();
  const matchDate = String(formData.get("matchDate") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const isHomeValue = String(formData.get("isHome") || "true").trim();
  const status = String(formData.get("status") || "scheduled").trim();
  const scoreTeamValue = String(formData.get("scoreTeam") || "").trim();
  const scoreOpponentValue = String(formData.get("scoreOpponent") || "").trim();
  const scorersValue = String(formData.get("scorers") || "").trim();

  if (!category || !team || !opponent || !matchDate || !location) {
    throw new Error("Tous les champs obligatoires doivent être remplis.");
  }

  await prisma.match.create({
    data: {
      category,
      team,
      opponent,
      matchDate: parseLocalDateTime(matchDate),
      location,
      isHome: isHomeValue === "true",
      status,
      scoreTeam: scoreTeamValue ? Number(scoreTeamValue) : null,
      scoreOpponent: scoreOpponentValue ? Number(scoreOpponentValue) : null,
      scorers: scorersValue || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/matchs");
  revalidatePath("/calendrier");
}

async function deleteMatch(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "admin") {
    redirect("/espace-club/profil");
  }

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("ID du match manquant.");
  }

  await prisma.match.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/matchs");
  revalidatePath("/calendrier");
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  switch (status) {
    case "scheduled":
      return "Programmé";
    case "postponed":
      return "Reporté";
    case "cancelled":
      return "Annulé";
    case "finished":
      return "Terminé";
    default:
      return status;
  }
}

function formatScore(scoreTeam: number | null, scoreOpponent: number | null) {
  if (scoreTeam === null || scoreOpponent === null) {
    return "Non renseigné";
  }

  return `${scoreTeam} - ${scoreOpponent}`;
}

export default async function AdminMatchsPage() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "admin") {
    redirect("/espace-club/profil");
  }

  const matches = await prisma.match.findMany({
    orderBy: {
      matchDate: "asc",
    },
  });

  return (
    <Container>
      <div className="py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Admin</Badge>
              <Badge>Matchs</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Gestion des matchs
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Ajoute, consulte, modifie et supprime les rencontres du calendrier
              du club.
            </p>
          </div>
          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-neutral-900">
              Ajouter un match
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Remplis les informations du match pour qu’il apparaisse
              automatiquement sur la page calendrier.
            </p>

            <form action={createMatch} className="mt-6 space-y-5">
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
                  placeholder="Ex : Seniors, U15, U13..."
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
                  placeholder="Ex : Seniors 1"
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
                  placeholder="Ex : FC Bourg"
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
                  placeholder="Ex : Stade Pierre Brichon"
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
                  defaultValue="true"
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
                  defaultValue="scheduled"
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
                    placeholder="Ex : 2"
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
                    placeholder="Ex : 1"
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
                  rows={3}
                  placeholder="Ex : Martin x2, Dupont ou Martin (12e), Dupont (57e)"
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Format libre pour cette V1 : Martin x2, Dupont / CSC / Martin
                  (12e).
                </p>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-csv-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Ajouter le match
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-neutral-900">
                  Matchs enregistrés
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Les matchs ajoutés ici apparaissent automatiquement sur la
                  page calendrier.
                </p>
              </div>

              <div className="rounded-full bg-csv-orange/10 px-3 py-1 text-xs font-bold text-csv-black">
                {matches.length} match{matches.length > 1 ? "s" : ""}
              </div>
            </div>

            {matches.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
                Aucun match enregistré pour le moment.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {matches.map((match: any) => (
                  <article
                    key={match.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {match.category}
                        </div>

                        <h3 className="mt-2 text-base font-extrabold text-neutral-900">
                          {match.team} vs {match.opponent}
                        </h3>

                        <div className="mt-4 space-y-2 text-sm text-neutral-700">
                          <div>
                            <span className="font-semibold text-neutral-900">
                              Date :
                            </span>{" "}
                            {formatDate(match.matchDate)}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900">
                              Lieu :
                            </span>{" "}
                            {match.location}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900">
                              Type :
                            </span>{" "}
                            {match.isHome ? "Domicile" : "Extérieur"}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900">
                              Statut :
                            </span>{" "}
                            {formatStatus(match.status)}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900">
                              Score :
                            </span>{" "}
                            {formatScore(match.scoreTeam, match.scoreOpponent)}
                          </div>

                          {match.scorers ? (
                            <div>
                              <span className="font-semibold text-neutral-900">
                                Buteurs :
                              </span>{" "}
                              {match.scorers}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/admin/matchs/${match.id}/edit`}
                          className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
                        >
                          Modifier
                        </Link>

                        <form action={deleteMatch}>
                          <input type="hidden" name="id" value={match.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
