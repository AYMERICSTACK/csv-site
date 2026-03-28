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

    const showEmailToMembers = Boolean(body?.showEmailToMembers);
    const showPhoneToMembers = Boolean(body?.showPhoneToMembers);

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        staffMember: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 },
      );
    }

    if (!currentUser.staffMemberId || !currentUser.staffMember) {
      return NextResponse.json(
        { error: "Aucune fiche staff liée à ce compte." },
        { status: 400 },
      );
    }

    // 🔥 optimisation : éviter update inutile
    if (
      showEmailToMembers === currentUser.showEmailToMembers &&
      showPhoneToMembers === currentUser.showPhoneToMembers
    ) {
      return NextResponse.json({
        id: currentUser.id,
        showEmailToMembers: currentUser.showEmailToMembers,
        showPhoneToMembers: currentUser.showPhoneToMembers,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        showEmailToMembers: currentUser.staffMember.email
          ? showEmailToMembers
          : false,
        showPhoneToMembers: currentUser.staffMember.phone
          ? showPhoneToMembers
          : false,
      },
      select: {
        id: true,
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
