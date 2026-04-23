import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function unauthorizedResponse() {
  return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
}

function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request, { params }: RouteContext) {
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

    const { slug } = await params;
    const body = await request.json();
    const userId = String(body.userId || "").trim();

    if (!userId) {
      return badRequestResponse("Utilisateur manquant.");
    }

    const commission = await prisma.commission.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
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
    const canManageCommission = isGlobalAdmin || isCommissionAdmin;

    if (!canManageCommission) {
      return forbiddenResponse();
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 },
      );
    }

    if (!targetUser.isActive) {
      return badRequestResponse("Cet utilisateur est inactif.");
    }

    const existingMembership = await prisma.commissionMembership.findUnique({
      where: {
        userId_commissionId: {
          userId: targetUser.id,
          commissionId: commission.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMembership) {
      return badRequestResponse(
        "Cet utilisateur a déjà accès à cette commission.",
      );
    }

    await prisma.commissionMembership.create({
      data: {
        userId: targetUser.id,
        commissionId: commission.id,
        isAdmin: false,
        isVisibleInCommission: true,
        roleLabel: null,
      },
    });

    revalidatePath("/espace-club/commissions");
    revalidatePath(`/espace-club/commissions/${slug}`);

    return NextResponse.json({
      success: true,
      message: `${targetUser.name} a maintenant accès à la commission ${commission.name}.`,
    });
  } catch (error) {
    console.error("Erreur ajout utilisateur commission :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
