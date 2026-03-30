import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    await requireRole(["admin", "educateurs"]);

    const formData = await request.formData();
    const id = String(formData.get("id") || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "ID équipe manquant." },
        { status: 400 },
      );
    }

    await prisma.team.delete({
      where: { id },
    });

    revalidatePath("/equipes");
    revalidatePath("/espace-educateurs");
    revalidatePath("/espace-educateurs/equipes");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur delete team :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
