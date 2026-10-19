import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { hasCurrentUserRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const access = await hasCurrentUserRole(["admin", "educateurs"]);
  if (!access.ok || !access.access.user.isActive) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const data = await request.formData();
  const id = String(data.get("id") || "");
  const file = data.get("portrait");
  if (!(file instanceof File) || file.size === 0 || file.size > 3 * 1024 * 1024 || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Portrait invalide" }, { status: 400 });
  }
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player || !player.photoUrl) return NextResponse.json({ error: "Joueur ou photo introuvable" }, { status: 404 });
  try {
    const buffer = await sharp(Buffer.from(await file.arrayBuffer())).resize(800, 800).jpeg({ quality: 92 }).toBuffer();
    const blob = await put(`players/portraits/manual-${id}-${Date.now()}.jpg`, buffer, { access: "public", addRandomSuffix: true, contentType: "image/jpeg" });
    await prisma.player.update({ where: { id }, data: { portraitUrl: blob.url } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
}
