import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isUserRole, type UserRole } from "./roles";

export async function getCurrentUserAccess() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: {
          commission: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!user || !isUserRole(user.role)) {
    return null;
  }

  const membershipRoles = user.memberships
    .map((membership) => membership.commission.slug)
    .filter(isUserRole);

  const availableRoles = Array.from(
    new Set<UserRole>([user.role, ...membershipRoles]),
  );

  return {
    session,
    user,
    availableRoles,
  };
}

export async function hasCurrentUserRole(allowedRoles: UserRole[]) {
  const access = await getCurrentUserAccess();

  if (!access) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const hasAccess = allowedRoles.some((role) =>
    access.availableRoles.includes(role),
  );

  if (!hasAccess) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  return { ok: true as const, access };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const access = await getCurrentUserAccess();

  if (!access) {
    redirect("/admin/login");
  }

  const hasAccess = allowedRoles.some((role) =>
    access.availableRoles.includes(role),
  );

  if (!hasAccess) {
    redirect("/espace-club");
  }

  return access;
}
