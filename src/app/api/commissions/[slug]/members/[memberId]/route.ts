import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type RouteContext = {
  params: Promise<{ slug: string; memberId: string }>;
};

function unauthorizedResponse() {
  return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return unauthorizedResponse();
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
      },
    });

    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { slug, memberId } = await params;

    const commission = await prisma.commission.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!commission) {
      return NextResponse.json(
        { error: "Commission introuvable." },
        { status: 404 },
      );
    }

    const linkedStaffMember = await prisma.staffMember.findFirst({
      where: {
        userId: currentUser.id,
        commissionId: commission.id,
      },
      select: {
        id: true,
        isCommissionAdmin: true,
      },
    });

    const isGlobalAdmin = currentUser.role === "admin";
    const isCommissionAdmin = linkedStaffMember?.isCommissionAdmin === true;
    const canManageCommission = isGlobalAdmin || isCommissionAdmin;

    if (!canManageCommission) {
      return forbiddenResponse();
    }

    const member = await prisma.staffMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        commissionId: true,
        isCommissionAdmin: true,
      },
    });

    if (!member || member.commissionId !== commission.id) {
      return NextResponse.json(
        { error: "Membre introuvable dans cette commission." },
        { status: 404 },
      );
    }

    await prisma.staffMember.update({
      where: { id: member.id },
      data: {
        commissionId: null,
        isCommissionAdmin: false,
      },
    });

    revalidatePath("/espace-club/commissions");
    revalidatePath(`/espace-club/commissions/${slug}`);

    return NextResponse.json({
      success: true,
      message: `${member.name} a été retiré de la commission.`,
    });
  } catch (error) {
    console.error("Erreur suppression membre commission :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
