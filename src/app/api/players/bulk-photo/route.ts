import { NextResponse } from "next/server";
import { hasCurrentUserRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { uploadPlayerPhotoAssets } from "@/lib/player-photo-assets";
import { syncPlayerPhotoByIdentity } from "@/lib/player-photo-sync";

const MAX_SIZE = 3.2 * 1024 * 1024;

export async function POST(request: Request) {
  const access = await hasCurrentUserRole(["admin", "educateurs"]);
  if (!access.ok) {
    return NextResponse.json(
      { error: "Accès non autorisé." },
      { status: access.reason === "unauthorized" ? 401 : 403 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const playerId = String(formData.get("playerId") || "");

    if (!(file instanceof File) || !playerId) {
      return NextResponse.json({ error: "Photo ou joueur manquant." }, { status: 400 });
    }

    if (!file.type.startsWith("image/") || file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Photo invalide ou trop lourde." }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!player) return NextResponse.json({ error: "Joueur introuvable." }, { status: 404 });

    const assets = await uploadPlayerPhotoAssets(file, `${player.firstName}-${player.lastName}`);
    if (!assets) return NextResponse.json({ error: "Photo invalide." }, { status: 400 });

    await prisma.player.update({
      where: { id: player.id },
      data: { photoUrl: assets.photoUrl, portraitUrl: assets.portraitUrl },
    });

    await syncPlayerPhotoByIdentity(
      player.firstName,
      player.lastName,
      assets.photoUrl,
      assets.portraitUrl,
    );

    return NextResponse.json({ ok: true, ...assets });
  } catch (error) {
    console.error("Bulk player photo upload error:", error);
    return NextResponse.json({ error: "Impossible d'importer cette photo." }, { status: 500 });
  }
}
