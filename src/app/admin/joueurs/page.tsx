import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import AdminPlayersBoard from "@/components/AdminPlayersBoard";

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

async function createPlayer(formData: FormData) {
  "use server";

  await requireRole(["admin", "educateurs"]);

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const team = String(formData.get("team") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const season = String(formData.get("season") || "2026/2027").trim();
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
      team: team || null,
      category: category || null,
      photoUrl,
      photoConsent,
      stats: {
        create: {
          season,
          goals: 0,
          assists: 0,
        },
      },
    },
  });

  revalidatePath("/admin/joueurs");
  revalidatePath("/admin/equipes");
}

async function updatePlayer(formData: FormData) {
  "use server";

  await requireRole(["admin", "educateurs"]);

  const id = String(formData.get("id") || "");
  const statId = String(formData.get("statId") || "");
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const team = String(formData.get("team") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const season = String(formData.get("season") || "2026/2027").trim();

  const currentPhotoUrl = String(formData.get("currentPhotoUrl") || "").trim();
  const photoFile = formData.get("photoFile") as File | null;

  const goals = Number(formData.get("goals") || 0);
  const assists = Number(formData.get("assists") || 0);
  const photoConsent = formData.get("photoConsent") === "on";
  const isActive = formData.get("isActive") === "on";

  if (!id || !firstName || !lastName) return;

  const uploadedPhotoUrl =
    photoFile && photoFile.size > 0
      ? await uploadPlayerPhoto(photoFile, `${firstName}-${lastName}`)
      : null;

  const photoUrl = uploadedPhotoUrl || currentPhotoUrl || null;

  await prisma.player.update({
    where: { id },
    data: {
      firstName,
      lastName,
      team: team || null,
      category: category || null,
      photoUrl,
      photoConsent,
      isActive,
    },
  });

  if (statId) {
    await prisma.playerStat.update({
      where: { id: statId },
      data: {
        season,
        goals: Number.isFinite(goals) ? goals : 0,
        assists: Number.isFinite(assists) ? assists : 0,
      },
    });
  } else {
    await prisma.playerStat.create({
      data: {
        playerId: id,
        season,
        goals: Number.isFinite(goals) ? goals : 0,
        assists: Number.isFinite(assists) ? assists : 0,
      },
    });
  }

  revalidatePath("/admin/joueurs");
  revalidatePath("/admin/equipes");
}

async function deletePlayer(formData: FormData) {
  "use server";

  await requireRole(["admin", "educateurs"]);

  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.player.delete({ where: { id } });

  revalidatePath("/admin/joueurs");
  revalidatePath("/admin/equipes");
}

export default async function AdminJoueursPage() {
  await requireRole(["admin", "educateurs"]);

  const season = "2026/2027";

  const players = await prisma.player.findMany({
    include: {
      stats: {
        where: { season },
        take: 1,
      },
    },
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { lastName: "asc" }],
  });

  const formattedPlayers = players.map((player) => ({
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    team: player.team,
    category: player.category,
    photoUrl: player.photoUrl,
    photoConsent: player.photoConsent,
    isActive: player.isActive,
    statId: player.stats[0]?.id || "",
    goals: player.stats[0]?.goals || 0,
    assists: player.stats[0]?.assists || 0,
  }));

  return (
    <AdminPlayersBoard
      season={season}
      players={formattedPlayers}
      createPlayer={createPlayer}
      updatePlayer={updatePlayer}
      deletePlayer={deletePlayer}
    />
  );
}
