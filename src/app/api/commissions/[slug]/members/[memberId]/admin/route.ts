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

export async function PATCH(_: Request, { params }: RouteContext) {
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

    if (currentUser.role !== "admin") {
      return forbiddenResponse();
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

    if (member.isCommissionAdmin) {
      return NextResponse.json({
        success: true,
        message: "Ce membre est déjà admin de la commission.",
      });
    }

    await prisma.$transaction([
      prisma.staffMember.updateMany({
        where: {
          commissionId: commission.id,
          isCommissionAdmin: true,
        },
        data: {
          isCommissionAdmin: false,
        },
      }),
      prisma.staffMember.update({
        where: { id: member.id },
        data: {
          isCommissionAdmin: true,
        },
      }),
    ]);

    revalidatePath("/espace-club/commissions");
    revalidatePath(`/espace-club/commissions/${slug}`);

    return NextResponse.json({
      success: true,
      message: `${member.name} est maintenant admin de la commission.`,
    });
  } catch (error) {
    console.error("Erreur définition admin commission :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
