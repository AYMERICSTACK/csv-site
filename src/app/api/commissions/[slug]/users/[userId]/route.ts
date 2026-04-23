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

/* =========================
   DELETE — supprimer accès
========================= */
export async function DELETE(_: Request, { params }: RouteContext) {
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
        isAdmin: true,
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Cet utilisateur n’a pas accès à cette commission." },
        { status: 404 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
      },
    });

    if (targetUser?.role === "admin" && !isGlobalAdmin) {
      return NextResponse.json(
        { error: "Seul un admin global peut retirer un admin global." },
        { status: 403 },
      );
    }

    if (targetMembership.isAdmin) {
      const adminCount = await prisma.commissionMembership.count({
        where: {
          commissionId: commission.id,
          isAdmin: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error: "Impossible de supprimer le dernier admin de la commission.",
          },
          { status: 400 },
        );
      }
    }

    await prisma.commissionMembership.delete({
      where: {
        userId_commissionId: {
          userId,
          commissionId: commission.id,
        },
      },
    });

    revalidatePath("/espace-club/commissions");
    revalidatePath(`/espace-club/commissions/${slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression accès commission :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/* =========================
   PATCH — éditer membership
   (roleLabel + visibilité)
========================= */
export async function PATCH(request: Request, { params }: RouteContext) {
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
    const body = await request.json().catch(() => null);

    const roleLabel =
      typeof body?.roleLabel === "string" ? body.roleLabel.trim() : "";

    const isVisibleInCommission =
      typeof body?.isVisibleInCommission === "boolean"
        ? body.isVisibleInCommission
        : null;

    if (isVisibleInCommission === null) {
      return NextResponse.json(
        { error: "Visibilité invalide." },
        { status: 400 },
      );
    }

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

    await prisma.commissionMembership.update({
      where: {
        userId_commissionId: {
          userId,
          commissionId: commission.id,
        },
      },
      data: {
        roleLabel: roleLabel || null,
        isVisibleInCommission,
      },
    });

    revalidatePath("/espace-club/commissions");
    revalidatePath(`/espace-club/commissions/${slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur mise à jour membership commission :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
