import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { hasCurrentUserRole } from "@/lib/auth-guard";

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const access = await hasCurrentUserRole(["admin", "communication"]);

    if (!access.ok) {
      return access.reason === "unauthorized"
        ? unauthorizedResponse()
        : forbiddenResponse();
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier reçu." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Le fichier est vide." },
        { status: 400 },
      );
    }

    const maxSize = 15 * 1024 * 1024; // 15 MB

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier dépasse 15 Mo." },
        { status: 400 },
      );
    }

    const originalName = sanitizeFileName(file.name || "fichier");

    const pathname = `news/${Date.now()}-${originalName}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type || null,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload actualités error:", error);

    return NextResponse.json(
      { error: "Impossible d’envoyer le fichier." },
      { status: 500 },
    );
  }
}
