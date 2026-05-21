import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hasRoleAccess } from "@/lib/auth-guard";

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

// GET — liste des partenaires (privé)
export async function GET() {
  const access = await requireSponsoringAccess();
  if (!access.ok) return access.response;

  const partners = await prisma.partner.findMany({
    orderBy: {
      sortOrder: "asc",
    },
  });

  return NextResponse.json(partners);
}

// POST — création partenaire
export async function POST(request: Request) {
  const access = await requireSponsoringAccess();
  if (!access.ok) return access.response;

  const body = await request.json();

  const { name, description, logoUrl, websiteUrl, isActive, sortOrder } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Le nom est obligatoire." },
      { status: 400 },
    );
  }

  const partner = await prisma.partner.create({
    data: {
      name,
      description: description || null,
      logoUrl: logoUrl || null,
      websiteUrl: websiteUrl || null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(partner, { status: 201 });
}
