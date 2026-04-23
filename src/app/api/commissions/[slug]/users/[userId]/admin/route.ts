import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type RouteContext = {
  params: Promise<{ slug: string; userId: string }>;
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
      include: {
        memberships: {
          select: {
            commissionId: true,
            isAdmin: true,
          },
        },
      },
    });

    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { slug, userId } = await params;

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

    const isGlobalAdmin = currentUser.role === "admin";
    const currentMembership = currentUser.memberships.find(
      (membership) => membership.commissionId === commission.id,
    );
    const isCommissionAdmin = currentMembership?.isAdmin === true;

    if (!isGlobalAdmin && !isCommissionAdmin) {
      return forbiddenResponse();
    }

    const targetMembership = await prisma.commissionMembership.findUnique({
      where: {
        userId_commissionId: {
          userId,
          commissionId: commission.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Cet utilisateur n’a pas accès à cette commission." },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.commissionMembership.updateMany({
        where: {
          commissionId: commission.id,
          isAdmin: true,
        },
        data: {
          isAdmin: false,
        },
      }),
      prisma.commissionMembership.update({
        where: {
          userId_commissionId: {
            userId,
            commissionId: commission.id,
          },
        },
        data: {
          isAdmin: true,
        },
      }),
    ]);

    revalidatePath("/espace-club/commissions");
    revalidatePath(`/espace-club/commissions/${slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur définition admin commission :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
