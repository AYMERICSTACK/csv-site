import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { CURRENT_FOOTBALL_SEASON } from "@/lib/football-season";
import AdminPlayersBoard from "@/components/AdminPlayersBoard";
import BulkPlayerPhotoImport from "@/components/BulkPlayerPhotoImport";
import { syncPlayerPhotoByIdentity } from "@/lib/player-photo-sync";
import { uploadPlayerPhotoAssets } from "@/lib/player-photo-assets";

async function createPlayer(formData: FormData) {
  "use server";

  await requireRole(["admin", "educateurs"]);

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const team = String(formData.get("team") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const season = String(formData.get("season") || CURRENT_FOOTBALL_SEASON).trim();
  const photoFile = formData.get("photoFile") as File | null;

  if (!firstName || !lastName) return;

  const photoAssets =
    photoFile && photoFile.size > 0
      ? await uploadPlayerPhotoAssets(photoFile, `${firstName}-${lastName}`)
      : null;

  await prisma.player.create({
    data: {
      firstName,
      lastName,
      team: team || null,
      category: category || null,
      photoUrl: photoAssets?.photoUrl || null,
      portraitUrl: photoAssets?.portraitUrl || null,
      photoConsent: false,
      stats: {
        create: {
          season,
          goals: 0,
          assists: 0,
        },
      },
    },
  });

  if (photoAssets) {
    await syncPlayerPhotoByIdentity(firstName, lastName, photoAssets.photoUrl, photoAssets.portraitUrl);
  }

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
  const season = String(formData.get("season") || CURRENT_FOOTBALL_SEASON).trim();

  const currentPhotoUrl = String(formData.get("currentPhotoUrl") || "").trim();
  const photoFile = formData.get("photoFile") as File | null;

  const goals = Number(formData.get("goals") || 0);
  const assists = Number(formData.get("assists") || 0);
  const isActive = formData.get("isActive") === "on";

  if (!id || !firstName || !lastName) return;

  const uploadedPhotoAssets =
    photoFile && photoFile.size > 0
      ? await uploadPlayerPhotoAssets(photoFile, `${firstName}-${lastName}`)
      : null;

  const photoUrl = uploadedPhotoAssets?.photoUrl || currentPhotoUrl || null;

  await prisma.player.update({
    where: { id },
    data: {
      firstName,
      lastName,
      team: team || null,
      category: category || null,
      photoUrl,
      ...(uploadedPhotoAssets ? { portraitUrl: uploadedPhotoAssets.portraitUrl } : {}),
      isActive,
    },
  });

  if (uploadedPhotoAssets) {
    await syncPlayerPhotoByIdentity(firstName, lastName, uploadedPhotoAssets.photoUrl, uploadedPhotoAssets.portraitUrl);
  }

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

  const season = CURRENT_FOOTBALL_SEASON;

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
    portraitUrl: player.portraitUrl,
    photoConsent: player.photoConsent,
    isActive: player.isActive,
    statId: player.stats[0]?.id || "",
    goals: player.stats[0]?.goals || 0,
    assists: player.stats[0]?.assists || 0,
  }));

  return (
    <>
      <div className="px-6 pt-6 md:px-8 md:pt-8">
        <BulkPlayerPhotoImport players={formattedPlayers.map(({ id, firstName, lastName, team, photoUrl, portraitUrl }) => ({ id, firstName, lastName, team, photoUrl, portraitUrl }))} />
      </div>
      <AdminPlayersBoard
      season={season}
      players={formattedPlayers}
      createPlayer={createPlayer}
      updatePlayer={updatePlayer}
      deletePlayer={deletePlayer}
    />
    </>
  );
}
