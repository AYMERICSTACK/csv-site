import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hasRoleAccess } from "@/lib/auth-guard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
}

async function requireSponsoringAccess() {
  const session = await auth();

  if (!session) return { ok: false, response: unauthorized() };

  if (!session.user?.email || !(await hasRoleAccess(session.user.email, ["admin", "sponsoring"]))) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true };
}

// GET — 1 partenaire
export async function GET(_: Request, { params }: RouteContext) {
  const access = await requireSponsoringAccess();
  if (!access.ok) return access.response;

  const { id } = await params;

  const partner = await prisma.partner.findUnique({
    where: { id },
  });

  if (!partner) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(partner);
}

// PUT — update
export async function PUT(request: Request, { params }: RouteContext) {
  const access = await requireSponsoringAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const body = await request.json();

  const { name, description, logoUrl, websiteUrl, isActive, sortOrder } = body;

  const existing = await prisma.partner.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const updated = await prisma.partner.update({
    where: { id },
    data: {
      name,
      description: description || null,
      logoUrl: logoUrl || null,
      websiteUrl: websiteUrl || null,
      isActive,
      sortOrder,
    },
  });

  return NextResponse.json(updated);
}

// DELETE
export async function DELETE(_: Request, { params }: RouteContext) {
  const access = await requireSponsoringAccess();
  if (!access.ok) return access.response;

  const { id } = await params;

  await prisma.partner.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
