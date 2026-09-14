import { prisma } from "@/lib/prisma";
import { normalizeConsentIdentity } from "@/lib/image-consent";

export function playerIdentityKey(firstName: string, lastName: string) {
  return `${normalizeConsentIdentity(firstName)}|${normalizeConsentIdentity(lastName)}`;
}

export function buildSharedPhotoMap<T extends { firstName: string; lastName: string; photoUrl?: string | null }>(
  players: T[],
) {
  const photos = new Map<string, string>();

  for (const player of players) {
    if (!player.photoUrl) continue;
    const key = playerIdentityKey(player.firstName, player.lastName);
    if (!photos.has(key)) photos.set(key, player.photoUrl);
  }

  return photos;
}

export async function syncPlayerPhotoByIdentity(
  firstName: string,
  lastName: string,
  photoUrl: string,
) {
  const activePlayers = await prisma.player.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true },
  });

  const identity = playerIdentityKey(firstName, lastName);
  const ids = activePlayers
    .filter((player) => playerIdentityKey(player.firstName, player.lastName) === identity)
    .map((player) => player.id);

  if (!ids.length) return;

  await prisma.player.updateMany({
    where: { id: { in: ids } },
    data: { photoUrl },
  });
}
