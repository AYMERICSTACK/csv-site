export const ROLES = [
  "admin",
  "communication",
  "bureau",
  "materiel",
  "sponsoring",
  "festivite",
  "educateurs",
  "buvette",
] as const;

export type UserRole = (typeof ROLES)[number];

export const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  communication: "/espace-club/profil",
  bureau: "/espace-club/profil",
  materiel: "/espace-club/profil",
  sponsoring: "/espace-sponsoring",
  festivite: "/espace-club/profil",
  educateurs: "/espace-club/profil",
  buvette: "/espace-club/profil",
};

export function isUserRole(role: string): role is UserRole {
  return ROLES.includes(role as UserRole);
}

export function getHomePathByRole(role?: string | null) {
  if (!role) return "/admin/login";
  if (!isUserRole(role)) return "/espace-club/profil";

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
