export const ROLES = [
  "admin",
  "member",
  "communication",
  "bureau",
  "materiel",
  "sponsoring",
  "festivite",
  "educateurs",
  "buvette",
  "licence",
] as const;

export type UserRole = (typeof ROLES)[number];

export const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  member: "/espace-club",
  communication: "/espace-club",
  bureau: "/espace-club",
  materiel: "/espace-club",
  sponsoring: "/espace-club",
  festivite: "/espace-club",
  educateurs: "/espace-club",
  buvette: "/espace-club",
  licence: "/espace-club",
};

export function isUserRole(role: string): role is UserRole {
  return ROLES.includes(role as UserRole);
}


export function commissionSlugToRole(slug: string): UserRole | null {
  const normalized = String(slug || "").trim().toLocaleLowerCase("fr-FR");

  // The Commission table uses the plural slug "festivites", while the
  // application role is historically named "festivite". Keep the DB slug
  // untouched and normalize it here so memberships grant the expected role.
  if (normalized === "festivites") return "festivite";

  return isUserRole(normalized) ? normalized : null;
}

export function getHomePathByRole(role?: string | null) {
  if (!role) return "/admin/login";
  if (!isUserRole(role)) return "/espace-club";

  return ROLE_HOME[role];
}

export function hasRequiredRole(
  userRole: string | null | undefined,
  allowedRoles: UserRole[],
) {
  if (!userRole) return false;
  if (!isUserRole(userRole)) return false;

  return allowedRoles.includes(userRole);
}
