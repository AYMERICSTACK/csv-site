import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isUserRole, type UserRole } from "./roles";

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
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

  if (!user) {
    redirect("/admin/login");
  }

  if (!isUserRole(user.role)) {
    redirect("/admin/login");
  }

  const membershipRoles = user.memberships
    .map((membership) => membership.commission.slug)
    .filter(isUserRole);

  const availableRoles = Array.from(
    new Set<UserRole>([user.role, ...membershipRoles]),
  );

  const hasAccess = allowedRoles.some((role) => availableRoles.includes(role));

  if (!hasAccess) {
    redirect("/espace-club");
  }

  return {
    session,
    user,
    availableRoles,
  };
}
