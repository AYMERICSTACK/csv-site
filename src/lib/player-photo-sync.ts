import { prisma } from "@/lib/prisma";
import { normalizeConsentIdentity } from "@/lib/image-consent";

export function playerIdentityKey(firstName: string, lastName: string) {
  return `${normalizeConsentIdentity(firstName)}|${normalizeConsentIdentity(lastName)}`;
}

export function buildSharedPhotoMap<T extends { firstName: string; lastName: string; photoUrl?: string | null; portraitUrl?: string | null }>(
  players: T[],
) {
  const photos = new Map<string, { photoUrl: string | null; portraitUrl: string | null }>();

  for (const player of players) {
    if (!player.photoUrl && !player.portraitUrl) continue;
    const key = playerIdentityKey(player.firstName, player.lastName);
    const current = photos.get(key);
    photos.set(key, {
      photoUrl: current?.photoUrl || player.photoUrl || null,
      portraitUrl: current?.portraitUrl || player.portraitUrl || null,
    });
  }

  return photos;
}

export async function syncPlayerPhotoByIdentity(
  firstName: string,
  lastName: string,
  photoUrl: string,
  portraitUrl?: string | null,
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
    data: {
      photoUrl,
      ...(portraitUrl !== undefined ? { portraitUrl } : {}),
    },
  });
}
