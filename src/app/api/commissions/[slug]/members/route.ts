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
      select: {
        id: true,
        role: true,
      },
    });

    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { slug } = await params;
    const body = await request.json();
    const memberId = String(body.memberId || "").trim();

    if (!memberId) {
      return badRequestResponse("Membre manquant.");
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
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre introuvable." },
        { status: 404 },
      );
    }

    if (member.commissionId === commission.id) {
      return badRequestResponse("Ce membre est déjà dans cette commission.");
    }

    await prisma.staffMember.update({
      where: { id: member.id },
      data: {
        commissionId: commission.id,
      },
    });

    revalidatePath("/espace-club/commissions");
    revalidatePath(`/espace-club/commissions/${slug}`);

    return NextResponse.json({
      success: true,
      message: `${member.name} a bien été ajouté à la commission ${commission.name}.`,
    });
  } catch (error) {
    console.error("Erreur ajout membre commission :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
