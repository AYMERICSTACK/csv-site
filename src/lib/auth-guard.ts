import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isUserRole, type UserRole } from "./roles";

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.user?.role;

  if (!role || !isUserRole(role)) {
    redirect("/admin/login");
  }

  if (!allowedRoles.includes(role)) {
    redirect("/espace-club");
  }

  return session;
}
