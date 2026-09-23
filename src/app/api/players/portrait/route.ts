import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { hasCurrentUserRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { generatePlayerPortraitFromUrl } from "@/lib/player-photo-assets";
import { syncPlayerPhotoByIdentity } from "@/lib/player-photo-sync";

export async function POST(request: Request) {
  const access = await hasCurrentUserRole(["admin", "educateurs"]);
  if (!access.ok) {
    return NextResponse.json(
      { error: "Accès non autorisé." },
      { status: access.reason === "unauthorized" ? 401 : 403 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const playerId = String(body.playerId || "");
    if (!playerId) return NextResponse.json({ error: "Joueur manquant." }, { status: 400 });

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, firstName: true, lastName: true, photoUrl: true },
    });

    if (!player?.photoUrl) {
      return NextResponse.json({ error: "Photo source introuvable." }, { status: 404 });
    }

    const portraitUrl = await generatePlayerPortraitFromUrl(
      player.photoUrl,
      `${player.firstName}-${player.lastName}`,
    );

    await prisma.player.update({ where: { id: player.id }, data: { portraitUrl } });
    await syncPlayerPhotoByIdentity(player.firstName, player.lastName, player.photoUrl, portraitUrl);

    // Classements is cached for five minutes. Invalidate its server-rendered
    // player URLs when the portrait changes, rather than waiting for the TTL.
    revalidatePath("/classements");
    revalidatePath("/classements/buteurs");
    revalidatePath("/calendrier");
    revalidatePath("/");

    return NextResponse.json({ ok: true, portraitUrl });
  } catch (error) {
    console.error("Player portrait generation error:", error);
    return NextResponse.json({ error: "Impossible de générer le portrait." }, { status: 500 });
  }
}
