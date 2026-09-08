import { getCurrentUserAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { normalizeTeamName } from "@/lib/teams";

export async function getRankingAccess() {
  const access = await getCurrentUserAccess();
  if (!access || !access.user.isActive) return null;
  const isAdmin = access.availableRoles.includes("admin");
  const isEducator = access.availableRoles.includes("educateurs");
  if (!isAdmin && !isEducator) return null;
  const favorite = await prisma.user.findUnique({
    where: { id: access.user.id },
    select: { favoriteTeam: { select: { category: true } } },
  });
  return {
    isAdmin,
    teams: isAdmin ? null : favorite?.favoriteTeam
      ? [normalizeTeamName(favorite.favoriteTeam.category)] : [],
  };
}
