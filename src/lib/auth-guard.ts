import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isUserRole, type UserRole } from "./roles";

export async function getUserAccessByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
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

  return { user, availableRoles };
}

export function canAccessRole(
  availableRoles: UserRole[],
  allowedRoles: UserRole[],
) {
  return allowedRoles.some((role) => availableRoles.includes(role));
}

export async function hasRoleAccess(email: string, allowedRoles: UserRole[]) {
  const access = await getUserAccessByEmail(email);

  if (!access) return false;

  return canAccessRole(access.availableRoles, allowedRoles);
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const access = await getUserAccessByEmail(session.user.email);

  if (!access) {
    redirect("/admin/login");
  }

  if (!canAccessRole(access.availableRoles, allowedRoles)) {
    redirect("/espace-club");
  }

  return {
    session,
    user: access.user,
    availableRoles: access.availableRoles,
  };
}
