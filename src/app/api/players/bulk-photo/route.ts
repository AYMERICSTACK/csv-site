import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { hasCurrentUserRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { syncPlayerPhotoByIdentity } from "@/lib/player-photo-sync";

const MAX_SIZE = 3.2 * 1024 * 1024;

function safeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const access = await hasCurrentUserRole(["admin", "educateurs"]);
  if (!access.ok) return NextResponse.json({ error: "Accès non autorisé." }, { status: access.reason === "unauthorized" ? 401 : 403 });
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const playerId = String(formData.get("playerId") || "");
    if (!(file instanceof File) || !playerId) return NextResponse.json({ error: "Photo ou joueur manquant." }, { status: 400 });
    if (!file.type.startsWith("image/") || file.size === 0 || file.size > MAX_SIZE) return NextResponse.json({ error: "Photo invalide ou trop lourde." }, { status: 400 });
    const player = await prisma.player.findUnique({ where: { id: playerId }, select: { id: true, firstName: true, lastName: true } });
    if (!player) return NextResponse.json({ error: "Joueur introuvable." }, { status: 404 });
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const blob = await put(`players/${safeName(`${player.firstName}-${player.lastName}`)}-${Date.now()}.${extension}`, file, { access: "public", addRandomSuffix: true });
    await prisma.player.update({ where: { id: player.id }, data: { photoUrl: blob.url } });
    await syncPlayerPhotoByIdentity(player.firstName, player.lastName, blob.url);
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error) {
    console.error("Bulk player photo upload error:", error);
    return NextResponse.json({ error: "Impossible d'importer cette photo." }, { status: 500 });
  }
}
