import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const password = String(formData.get("password") || "");
    const signupNote = String(formData.get("signupNote") || "").trim();
    const commissionIds = formData
      .getAll("commissionIds")
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (!name) {
      return badRequest("Le nom est obligatoire.");
    }

    if (!email) {
      return badRequest("L’adresse email est obligatoire.");
    }

    if (!password || password.length < 8) {
      return badRequest("Le mot de passe doit contenir au moins 8 caractères.");
    }

    if (commissionIds.length === 0) {
      return badRequest("Sélectionne au moins une commission.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return badRequest("Un compte existe déjà avec cette adresse email.");
    }

    const commissions = await prisma.commission.findMany({
      where: {
        id: {
          in: commissionIds,
        },
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    if (commissions.length !== commissionIds.length) {
      return badRequest("Une ou plusieurs commissions sont invalides.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        signupNote: signupNote || null,
        passwordHash,
        role: "member",
        isActive: false,
        memberships: {
          create: commissionIds.map((commissionId) => ({
            commissionId,
            isAdmin: false,
          })),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      userId: createdUser.id,
      email: createdUser.email,
    });
  } catch (error) {
    console.error("Erreur inscription interne :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
