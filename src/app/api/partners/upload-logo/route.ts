import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function slugifyFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const role = session.user?.role;

    if (role !== "admin" && role !== "sponsoring") {
      return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier reçu." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format invalide. Utilise PNG, JPG ou WEBP." },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 5 Mo." },
        { status: 400 },
      );
    }

    const safeName = slugifyFileName(file.name || "logo");
    const pathname = `partners/${Date.now()}-${safeName}`;

    const blob = await put(pathname, file, {
      access: "public",
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Erreur upload logo partner:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
