import { prisma } from "@/lib/prisma";
import {
  CURRENT_FOOTBALL_SEASON,
  getFootballSeasonDateRange,
} from "@/lib/football-season";

export async function refreshPlayerStats(
  playerIds: string[],
  season: string = CURRENT_FOOTBALL_SEASON,
) {
  const uniquePlayerIds = Array.from(new Set(playerIds)).filter(Boolean);
  if (!uniquePlayerIds.length) return;

  const { start, end } = getFootballSeasonDateRange(season);

  await Promise.all(
    uniquePlayerIds.map(async (playerId) => {
      const [goals, assists] = await Promise.all([
        prisma.matchEvent.count({
          where: {
            playerId,
            type: "GOAL",
            match: {
              matchDate: {
                gte: start,
                lt: end,
              },
            },
          },
        }),
        prisma.matchEvent.count({
          where: {
            playerId,
            type: "ASSIST",
            match: {
              matchDate: {
                gte: start,
                lt: end,
              },
            },
          },
        }),
      ]);

      await prisma.playerStat.upsert({
        where: {
          playerId_season: {
            playerId,
            season,
          },
        },
        update: { goals, assists },
        create: { playerId, season, goals, assists },
      });
    }),
  );
}
