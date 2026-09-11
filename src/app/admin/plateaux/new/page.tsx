import { requireRole } from "@/lib/auth-guard";
import Container from "@/components/Container";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseParisDateTime } from "@/lib/paris-datetime";
import { SCHOOL_FOOT_TEAMS, normalizeTeamName } from "@/lib/teams";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

function splitLines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function getOrCreateSchoolTeam(teamName: string) {
  const normalized = normalizeTeamName(teamName);

  const existingTeams = await prisma.team.findMany({
    where: { isPublished: true },
    select: { id: true, category: true },
  });

  const existing = existingTeams.find(
    (team) => normalizeTeamName(team.category) === normalized,
  );

  if (existing) return existing.id;

  let group = await prisma.teamGroup.findFirst({
    where: {
      title: { equals: "École de foot", mode: "insensitive" },
    },
    select: { id: true },
  });

  if (!group) {
    group = await prisma.teamGroup.create({
      data: {
        title: "École de foot",
        subtitle: "U7, U9 et U11",
        badge: "École de foot",
        sortOrder: 30,
        isPublished: true,
      },
      select: { id: true },
    });
  }

  const created = await prisma.team.create({
    data: {
      category: teamName,
      coach: "À renseigner",
      groupId: group.id,
      isPublished: true,
    },
    select: { id: true },
  });

  return created.id;
}

async function createPlateau(formData: FormData) {
  "use server";
  await requireRole(["admin", "educateurs"]);

  const teamName = String(formData.get("teamName") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const rawEventDate = String(formData.get("eventDate") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const format = String(formData.get("format") || "festival").trim();
  const notes = String(formData.get("notes") || "").trim();
  const participants = splitLines(formData.get("participants"));
  const opponents = splitLines(formData.get("opponents"));

  if (!teamName || !rawEventDate || !location) {
    throw new Error("Équipe, date et lieu sont obligatoires.");
  }

  if (!SCHOOL_FOOT_TEAMS.includes(teamName as (typeof SCHOOL_FOOT_TEAMS)[number])) {
    throw new Error("Les plateaux sont réservés à l’école de foot U7, U9 et U11.");
  }

  if (!["festival", "matches"].includes(format)) {
    throw new Error("Format de plateau invalide.");
  }

  const teamId = await getOrCreateSchoolTeam(teamName);
  const eventDate = parseParisDateTime(rawEventDate);

  await prisma.plateau.create({
    data: {
      teamId,
      title: title || null,
      eventDate,
      location,
      format,
      status: "scheduled",
      notes: notes || null,
      participants: {
        create: participants.map((name, index) => ({ name, sortOrder: index })),
      },
      games: {
        create: opponents.map((opponent, index) => ({
          opponent,
          scheduledAt: eventDate,
          sortOrder: index,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/calendrier");
  revalidatePath("/admin/plateaux");
  revalidatePath("/admin/equipes");
  revalidatePath("/espace-educateurs");
  redirect("/admin/plateaux");
}

type PageProps = {
  searchParams?: Promise<{ team?: string }>;
};

export default async function NewPlateauPage({ searchParams }: PageProps) {
  await requireRole(["admin", "educateurs"]);

  const query = await searchParams;
  const requestedTeam = String(query?.team || "").trim();
  const defaultTeam = SCHOOL_FOOT_TEAMS.includes(
    requestedTeam as (typeof SCHOOL_FOOT_TEAMS)[number],
  )
    ? requestedTeam
    : "";

  const defaultFormat = defaultTeam.startsWith("U11") ? "matches" : "festival";

  return (
    <Container>
      <div className="pb-24 pt-6 md:py-14">
        <Link
          href="/admin/plateaux"
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-black"
        >
          <ArrowLeft size={16} /> Retour aux plateaux
        </Link>

        <section className="mt-5 rounded-[2rem] bg-neutral-950 p-6 text-white md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
            École de foot
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">Ajouter un plateau</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
            U7/U9 : plusieurs clubs dans un même rassemblement. U11 : un plateau peut contenir plusieurs petites rencontres.
          </p>
        </section>

        <form action={createPlateau} className="mt-6 space-y-5">
          <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold">
                Équipe
                <select
                  name="teamName"
                  required
                  defaultValue={defaultTeam}
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
                >
                  <option value="">Choisir</option>
                  {SCHOOL_FOOT_TEAMS.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-bold">
                Type de plateau
                <select
                  name="format"
                  defaultValue={defaultFormat}
                  className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3"
                >
                  <option value="festival">U7 / U9 — rassemblement</option>
                  <option value="matches">U11 — plusieurs rencontres</option>
                </select>
              </label>

              <label className="text-sm font-bold">
                Date / heure
                <input
                  type="datetime-local"
                  name="eventDate"
                  required
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
              </label>

              <label className="text-sm font-bold">
                Lieu
                <input
                  name="location"
                  required
                  placeholder="Ex : Stade Brichon"
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
              </label>

              <label className="text-sm font-bold md:col-span-2">
                Titre optionnel
                <input
                  name="title"
                  placeholder="Ex : Plateau U9 à Viriat"
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
              </label>

              <label className="text-sm font-bold">
                Clubs participants <span className="font-normal text-neutral-500">(un par ligne)</span>
                <textarea
                  name="participants"
                  rows={6}
                  placeholder={"Bourg Sud\nPéronnas\nBresse Foot"}
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
              </label>

              <label className="text-sm font-bold">
                Adversaires U11 <span className="font-normal text-neutral-500">(un par ligne)</span>
                <textarea
                  name="opponents"
                  rows={6}
                  placeholder={"Plaine Tonique / Manziat\nACCFT / ESR"}
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
                <span className="mt-2 block text-xs font-normal text-neutral-500">
                  Pour U7/U9, laisse cette zone vide. Pour U11, chaque ligne crée une rencontre dans le plateau.
                </span>
              </label>

              <label className="text-sm font-bold md:col-span-2">
                Notes
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Organisation, terrain, horaires particuliers…"
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white md:w-auto"
          >
            <CheckCircle2 size={18} /> Créer le plateau
          </button>
        </form>
      </div>
    </Container>
  );
}
