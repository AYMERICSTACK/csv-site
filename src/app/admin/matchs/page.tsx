import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import MatchCardActions from "./MatchCardActions";
import {
  CalendarDays,
  MapPin,
  Shield,
  Clock3,
  Trophy,
  ArrowLeft,
} from "lucide-react";

function parseLocalDateTime(value: string) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

function canManageMatches(role?: string | null) {
  return role === "admin" || role === "educateurs";
}

async function createMatch(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (!canManageMatches(session.user?.role)) {
    redirect("/espace-club");
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

  if (!canManageMatches(session.user?.role)) {
    redirect("/espace-club");
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

function getStatusClasses(status: string) {
  switch (status) {
    case "scheduled":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "postponed":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    case "finished":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
  }
}

function formatScore(scoreTeam: number | null, scoreOpponent: number | null) {
  if (scoreTeam === null || scoreOpponent === null) {
    return null;
  }

  return `${scoreTeam} - ${scoreOpponent}`;
}

type MatchItem = {
  id: string;
  category: string;
  team: string;
  opponent: string;
  matchDate: Date;
  location: string;
  isHome: boolean;
  status: string;
  scoreTeam: number | null;
  scoreOpponent: number | null;
  scorers: string | null;
};

function MatchSection({
  title,
  description,
  matches,
  emptyLabel,
  deleteAction,
}: {
  title: string;
  description: string;
  matches: MatchItem[];
  emptyLabel: string;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <section className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-neutral-900">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {description}
          </p>
        </div>

        <div className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-bold text-neutral-800">
          {matches.length} match{matches.length > 1 ? "s" : ""}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {matches.map((match) => {
            const score = formatScore(match.scoreTeam, match.scoreOpponent);

            return (
              <article
                key={match.id}
                className="group rounded-[1.5rem] border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-600">
                        {match.category}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-bold ${getStatusClasses(
                          match.status,
                        )}`}
                      >
                        {formatStatus(match.status)}
                      </span>

                      <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold text-neutral-600">
                        {match.isHome ? "Domicile" : "Extérieur"}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-extrabold tracking-tight text-neutral-900">
                      {match.team} <span className="text-neutral-400">vs</span>{" "}
                      {match.opponent}
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <div className="mt-0.5 text-neutral-500">
                          <Clock3 size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                            Date
                          </div>
                          <div className="mt-1 text-sm font-semibold text-neutral-900">
                            {formatDate(match.matchDate)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <div className="mt-0.5 text-neutral-500">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                            Lieu
                          </div>
                          <div className="mt-1 text-sm font-semibold text-neutral-900">
                            {match.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    {match.scorers ? (
                      <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                          Buteurs
                        </div>
                        <div className="mt-1 whitespace-pre-line text-sm font-semibold text-neutral-900">
                          {match.scorers}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:w-48">
                    <div className="rounded-[1.25rem] border border-neutral-200 bg-neutral-50 p-4 text-center shadow-sm">
                      <div className="flex items-center justify-center gap-2 text-neutral-500">
                        <Trophy size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          Score
                        </span>
                      </div>

                      <div className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-900">
                        {score || "—"}
                      </div>
                    </div>

                    <MatchCardActions
                      matchId={match.id}
                      deleteAction={deleteAction}
                    />

                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                      <Shield size={15} className="text-neutral-500" />
                      <span className="font-medium">
                        {match.isHome ? "Réception" : "Déplacement"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function AdminMatchsPage() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (!canManageMatches(session.user?.role)) {
    redirect("/espace-club");
  }

  const role = session.user?.role;
  const backHref = role === "admin" ? "/admin" : "/espace-club";
  const backLabel = role === "admin" ? "Retour admin" : "Retour espace club";

  const matches = await prisma.match.findMany({
    orderBy: {
      matchDate: "asc",
    },
  });

  const upcomingMatches = matches.filter(
    (match) => match.status !== "finished",
  );
  const finishedMatches = matches.filter(
    (match) => match.status === "finished",
  );

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 px-6 py-8 shadow-sm md:px-8 md:py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
          <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={backHref}>
                  <Badge>{role === "admin" ? "Admin" : "Espace club"}</Badge>
                </Link>

                <Link href="/admin/matchs">
                  <Badge>Matchs</Badge>
                </Link>
              </div>

              <div className="mt-4">
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={14} />
                  {backLabel}
                </Link>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Gestion des matchs
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Ajoute, consulte, modifie et supprime les rencontres du club
                depuis une interface claire et centralisée.
              </p>
            </div>

            <AdminLogoutButton />
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                <CalendarDays size={20} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-neutral-900">
                  Ajouter un match
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  Remplis les informations pour publier automatiquement la
                  rencontre sur le calendrier.
                </p>
              </div>
            </div>

            <form action={createMatch} className="mt-6 space-y-5">
              <div>
                <label htmlFor="category" className="label">
                  Catégorie
                </label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  placeholder="Ex : Seniors, U15, U13..."
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="team" className="label">
                  Équipe
                </label>
                <input
                  id="team"
                  name="team"
                  type="text"
                  placeholder="Ex : Seniors 1"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="opponent" className="label">
                  Adversaire
                </label>
                <input
                  id="opponent"
                  name="opponent"
                  type="text"
                  placeholder="Ex : FC Bourg"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="matchDate" className="label">
                  Date et heure
                </label>
                <input
                  id="matchDate"
                  name="matchDate"
                  type="datetime-local"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="label">
                  Lieu
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Ex : Stade Pierre Brichon"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="isHome" className="label">
                  Type de rencontre
                </label>
                <select
                  id="isHome"
                  name="isHome"
                  defaultValue="true"
                  className="input"
                >
                  <option value="true">Domicile</option>
                  <option value="false">Extérieur</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="label">
                  Statut
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="scheduled"
                  className="input"
                >
                  <option value="scheduled">Programmé</option>
                  <option value="postponed">Reporté</option>
                  <option value="cancelled">Annulé</option>
                  <option value="finished">Terminé</option>
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="scoreTeam" className="label">
                    Score CS Viriat
                  </label>
                  <input
                    id="scoreTeam"
                    name="scoreTeam"
                    type="number"
                    min="0"
                    placeholder="Ex : 2"
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="scoreOpponent" className="label">
                    Score adversaire
                  </label>
                  <input
                    id="scoreOpponent"
                    name="scoreOpponent"
                    type="number"
                    min="0"
                    placeholder="Ex : 1"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="scorers" className="label">
                  Buteurs
                </label>
                <textarea
                  id="scorers"
                  name="scorers"
                  rows={3}
                  placeholder="Ex : Martin x2, Dupont ou Martin (12e), Dupont (57e)"
                  className="input"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Format libre pour cette V1 : Martin x2, Dupont / CSC / Martin
                  (12e).
                </p>
              </div>

              <button type="submit" className="btn-primary">
                Ajouter le match
              </button>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-neutral-900">
                  Matchs enregistrés
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  Les rencontres ajoutées ici apparaissent automatiquement sur
                  la page calendrier.
                </p>
              </div>

              <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-neutral-900">
                {matches.length} match{matches.length > 1 ? "s" : ""} au total
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <MatchSection
                title="À venir / en cours"
                description="Retrouve ici les rencontres programmées, reportées ou encore non finalisées."
                matches={upcomingMatches}
                emptyLabel="Aucun match à venir pour le moment."
                deleteAction={deleteMatch}
              />

              <MatchSection
                title="Terminés"
                description="Les matchs finalisés restent accessibles ici avec leur score et leurs buteurs."
                matches={finishedMatches}
                emptyLabel="Aucun match terminé pour le moment."
                deleteAction={deleteMatch}
              />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
