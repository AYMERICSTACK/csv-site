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

export async function PATCH(request: Request, { params }: RouteContext) {
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

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();

    const showMembers = Boolean(body.showMembers);
    const showEmail = Boolean(body.showEmail);
    const showPhone = Boolean(body.showPhone);

    if (!name) {
      return badRequestResponse("Le nom de la commission est obligatoire.");
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

    const updatedCommission = await prisma.commission.update({
      where: { id: commission.id },
      data: {
        name,
        description: description || null,
        email: email || null,
        phone: phone || null,
        showMembers,
        showEmail,
        showPhone,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        email: true,
        phone: true,
        showMembers: true,
        showEmail: true,
        showPhone: true,
      },
    });

    revalidatePath("/espace-club/commissions");
    revalidatePath(`/espace-club/commissions/${slug}`);

    return NextResponse.json({
      success: true,
      commission: updatedCommission,
    });
  } catch (error) {
    console.error("Erreur modification commission :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
