import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await request.json();

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        showEmailToMembers: true,
        showPhoneToMembers: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 },
      );
    }

    const { name, email, phone, showEmailToMembers, showPhoneToMembers } = body;

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";

    const existingEmailUser =
      cleanEmail && cleanEmail !== currentUser.email
        ? await prisma.user.findUnique({ where: { email: cleanEmail } })
        : null;

    if (existingEmailUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: cleanName || currentUser.name,
        email: cleanEmail || currentUser.email,
        phone: cleanPhone || null,
        showEmailToMembers: cleanEmail ? Boolean(showEmailToMembers) : false,
        showPhoneToMembers: cleanPhone ? Boolean(showPhoneToMembers) : false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        showEmailToMembers: true,
        showPhoneToMembers: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PATCH /api/me/profile error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
