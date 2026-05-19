import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import Container from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { CLUB_CATEGORIES } from "@/lib/categories";
import { CLUB_TEAMS, normalizeTeamName, slugifyTeam } from "@/lib/teams";
import DeletePlayerButton from "@/components/DeletePlayerButton";
import PlayerPhotoInput from "@/components/PlayerPhotoInput";

type PageProps = {
  params: Promise<{ team: string }>;
};

function canManageTeamPlayers(role?: string | null) {
  return role === "admin" || role === "educateurs";
}

async function uploadPlayerPhoto(file: File, playerName: string) {
  if (!file || file.size === 0) return null;

  const safeName = playerName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const extension = file.name.split(".").pop() || "jpg";

  const blob = await put(
    `players/${safeName}-${Date.now()}.${extension}`,
    file,
    { access: "public" },
  );

  return blob.url;
}

function getCategoryFromTeam(team: string) {
  if (team.startsWith("Seniors")) return "Seniors";
  if (team.startsWith("U15")) return "U15";
  if (team.startsWith("U13")) return "U13";
  if (team.startsWith("U11")) return "U11";
  if (team.startsWith("U9")) return "U9";
  if (team.startsWith("U7")) return "U7";
  return team;
}

export default async function AdminEquipeJoueursPage({ params }: PageProps) {
  const session = await auth();

  if (!session) redirect("/admin/login");
  if (!canManageTeamPlayers(session.user?.role)) redirect("/espace-club");

  const { team: teamSlug } = await params;
  const season = "2026/2027";

  const foundTeamName = CLUB_TEAMS.find(
    (team) => slugifyTeam(team) === teamSlug,
  );

  if (!foundTeamName) redirect("/admin/equipes");

  const teamName: string = foundTeamName;

  async function createPlayer(formData: FormData) {
    "use server";

    const session = await auth();

    if (!session) redirect("/admin/login");
    if (!canManageTeamPlayers(session.user?.role)) redirect("/espace-club");

    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const photoFile = formData.get("photoFile") as File | null;
    const photoConsent = formData.get("photoConsent") === "on";

    if (!firstName || !lastName) return;

    const photoUrl =
      photoFile && photoFile.size > 0
        ? await uploadPlayerPhoto(photoFile, `${firstName}-${lastName}`)
        : null;

    await prisma.player.create({
      data: {
        firstName,
        lastName,
        team: teamName,
        category: category || getCategoryFromTeam(teamName),
        photoUrl,
        photoConsent,
        isActive: true,
        stats: {
          create: {
            season,
            goals: 0,
            assists: 0,
          },
        },
      },
    });

    revalidatePath(`/admin/equipes/${teamSlug}`);
    revalidatePath(`/admin/equipes/${teamSlug}/joueurs`);
    revalidatePath("/admin/equipes");
    revalidatePath("/classements");
  }

  async function updatePlayer(formData: FormData) {
    "use server";

    const session = await auth();

    if (!session) redirect("/admin/login");
    if (!canManageTeamPlayers(session.user?.role)) redirect("/espace-club");

    const id = String(formData.get("id") || "").trim();
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const currentPhotoUrl = String(
      formData.get("currentPhotoUrl") || "",
    ).trim();
    const photoFile = formData.get("photoFile") as File | null;
    const photoConsent = formData.get("photoConsent") === "on";
    const isActive = formData.get("isActive") === "on";

    if (!id || !firstName || !lastName) return;

    const player = await prisma.player.findUnique({
      where: { id },
      select: { team: true },
    });

    if (!player || normalizeTeamName(player.team || "") !== teamName) return;

    const uploadedPhotoUrl =
      photoFile && photoFile.size > 0
        ? await uploadPlayerPhoto(photoFile, `${firstName}-${lastName}`)
        : null;

    await prisma.player.update({
      where: { id },
      data: {
        firstName,
        lastName,
        team: teamName,
        category: category || getCategoryFromTeam(teamName),
        photoUrl: uploadedPhotoUrl || currentPhotoUrl || null,
        photoConsent,
        isActive,
      },
    });

    revalidatePath(`/admin/equipes/${teamSlug}`);
    revalidatePath(`/admin/equipes/${teamSlug}/joueurs`);
    revalidatePath("/admin/equipes");
    revalidatePath("/classements");
  }

  async function deletePlayer(formData: FormData) {
    "use server";

    const session = await auth();

    if (!session) redirect("/admin/login");
    if (!canManageTeamPlayers(session.user?.role)) redirect("/espace-club");

    const id = String(formData.get("id") || "").trim();
    if (!id) return;

    const player = await prisma.player.findUnique({
      where: { id },
      select: { team: true },
    });

    if (!player || normalizeTeamName(player.team) !== teamName) return;

    await prisma.player.delete({
      where: { id },
    });

    revalidatePath(`/admin/equipes/${teamSlug}`);
    revalidatePath(`/admin/equipes/${teamSlug}/joueurs`);
    revalidatePath("/admin/equipes");
    revalidatePath("/classements");
  }

  const players = await prisma.player.findMany({
    where: {
      team: teamName,
    },
    include: {
      stats: {
        where: { season },
        take: 1,
      },
    },
    orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <Container>
      <div className="py-14">
        <Link
          href={`/admin/equipes/${teamSlug}`}
          className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50"
        >
          ← Retour à l’équipe
        </Link>

        <section className="mt-6 rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Effectif
              </div>

              <h1 className="mt-2 text-4xl font-black text-neutral-950">
                Joueurs — {teamName}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
                Ajoutez les joueurs du groupe, gérez les photos et
                l’autorisation d’affichage.
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
            <h2 className="text-lg font-black text-neutral-950">
              Ajouter un joueur
            </h2>

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
                name="category"
                defaultValue={getCategoryFromTeam(teamName)}
                className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-orange-300"
              >
                <option value="">Sélectionner une catégorie</option>
                {CLUB_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700">
                <input type="checkbox" name="photoConsent" />
                Photo autorisée
              </label>
            </div>

            <div className="mt-4">
              <PlayerPhotoInput />
            </div>

            <button className="mt-5 rounded-xl bg-csv-black px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
              Ajouter le joueur
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-neutral-950">
            Effectif actuel
          </h2>

          <div className="mt-5 grid gap-4">
            {players.map((player) => {
              const stat = player.stats[0];

              return (
                <form
                  key={player.id}
                  action={updatePlayer}
                  className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 transition hover:border-orange-200 hover:shadow-md"
                >
                  <input type="hidden" name="id" value={player.id} />
                  <input
                    type="hidden"
                    name="currentPhotoUrl"
                    value={player.photoUrl || ""}
                  />

                  <div className="grid gap-4 lg:grid-cols-[70px_1fr_150px]">
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
                      <div className="grid gap-3 md:grid-cols-3">
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

                      <div className="mt-3">
                        <PlayerPhotoInput label="Modifier la photo" compact />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4">
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
                          Joueur actif
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-orange-50 p-3 text-center">
                          <div className="text-xs font-bold uppercase text-orange-700">
                            Buts
                          </div>
                          <div className="text-xl font-black">
                            {stat?.goals || 0}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-neutral-100 p-3 text-center">
                          <div className="text-xs font-bold uppercase text-neutral-600">
                            Passes
                          </div>
                          <div className="text-xl font-black">
                            {stat?.assists || 0}
                          </div>
                        </div>
                      </div>

                      <button className="rounded-xl bg-csv-orange px-4 py-2 text-sm font-bold text-white">
                        Enregistrer
                      </button>

                      <DeletePlayerButton
                        playerId={player.id}
                        firstName={player.firstName}
                        lastName={player.lastName}
                        deletePlayer={deletePlayer}
                      />
                    </div>
                  </div>
                </form>
              );
            })}

            {!players.length && (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm font-semibold text-neutral-500">
                Aucun joueur dans cette équipe.
              </div>
            )}
          </div>
        </section>
      </div>
    </Container>
  );
}
