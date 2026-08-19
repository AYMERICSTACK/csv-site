export const revalidate = 300;

import Container from "@/components/Container";
import PublicRankingsBoard from "@/components/PublicRankingsBoard";
import { prisma } from "@/lib/prisma";
import {
  CURRENT_FOOTBALL_SEASON,
  getFootballSeasonDateRange,
} from "@/lib/football-season";

const FFF_CLUB_URL =
  "https://epreuves.fff.fr/competition/club/504312-c-s-viriat/club";

const defaultOfficialTeamRankings = [
  { label: "Seniors 1", category: "Seniors", level: "Équipe fanion" },
  { label: "Seniors 2", category: "Seniors", level: "Réserve" },
  { label: "Seniors 3", category: "Seniors", level: "District" },
  { label: "Seniors 4", category: "Seniors", level: "District" },
  { label: "U20", category: "Formation", level: "Jeunes" },
  { label: "U17", category: "Formation", level: "Jeunes" },
  { label: "U15 1", category: "Formation", level: "Jeunes" },
  { label: "U15 2", category: "Formation", level: "Jeunes" },
  { label: "U13 1", category: "École de foot", level: "Jeunes" },
  { label: "U13 2", category: "École de foot", level: "Jeunes" },
  { label: "U13 3", category: "École de foot", level: "Jeunes" },
  { label: "U13 4", category: "École de foot", level: "Jeunes" },
];

export default async function ClassementsPage() {
  const season = CURRENT_FOOTBALL_SEASON;
  const { start, end } = getFootballSeasonDateRange(season);
  const now = new Date();

  const [players, teamSettings, seasonMatches] = await Promise.all([
    prisma.player.findMany({
      where: {
        isActive: true,
      },
      include: {
        stats: {
          where: { season },
          take: 1,
        },
      },
      orderBy: [{ category: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.teamSetting.findMany(),
    prisma.match.findMany({
      where: {
        matchDate: {
          gte: start,
          lt: end,
        },
      },
      orderBy: {
        matchDate: "asc",
      },
    }),
  ]);

  const formattedPlayers = players.map((player) => ({
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    team: player.team,
    category: player.category,
    photoUrl: player.photoUrl,
    photoConsent: player.photoConsent,
    goals: player.stats[0]?.goals || 0,
    assists: player.stats[0]?.assists || 0,
  }));

  const completedMatches = seasonMatches.filter(
    (match) =>
      match.status === "finished" &&
      match.scoreTeam !== null &&
      match.scoreOpponent !== null,
  );

  const wins = completedMatches.filter(
    (match) => (match.scoreTeam ?? 0) > (match.scoreOpponent ?? 0),
  ).length;
  const draws = completedMatches.filter(
    (match) => match.scoreTeam === match.scoreOpponent,
  ).length;
  const losses = completedMatches.filter(
    (match) => (match.scoreTeam ?? 0) < (match.scoreOpponent ?? 0),
  ).length;

  const goalsFor = completedMatches.reduce(
    (total, match) => total + (match.scoreTeam ?? 0),
    0,
  );
  const goalsAgainst = completedMatches.reduce(
    (total, match) => total + (match.scoreOpponent ?? 0),
    0,
  );

  const recentResults = [...completedMatches]
    .sort((a, b) => b.matchDate.getTime() - a.matchDate.getTime())
    .slice(0, 4)
    .map((match) => ({
      id: match.id,
      category: match.category,
      team: match.team,
      opponent: match.opponent,
      matchDate: match.matchDate.toISOString(),
      location: match.location,
      isHome: match.isHome,
      scoreTeam: match.scoreTeam,
      scoreOpponent: match.scoreOpponent,
    }));

  const upcomingMatches = seasonMatches
    .filter(
      (match) =>
        match.matchDate >= now &&
        match.status !== "finished" &&
        match.status !== "cancelled",
    )
    .slice(0, 4)
    .map((match) => ({
      id: match.id,
      category: match.category,
      team: match.team,
      opponent: match.opponent,
      matchDate: match.matchDate.toISOString(),
      location: match.location,
      isHome: match.isHome,
      status: match.status,
    }));

  const teamSettingsByName = new Map(
    teamSettings.map((setting) => [setting.team, setting.fffUrl]),
  );

  const officialTeamRankings = defaultOfficialTeamRankings.map((team) => ({
    ...team,
    url: teamSettingsByName.get(team.label) || undefined,
  }));

  return (
    <Container>
      <div className="py-14">
        <PublicRankingsBoard
          season={season}
          players={formattedPlayers}
          fffClubUrl={FFF_CLUB_URL}
          officialTeamRankings={officialTeamRankings}
          seasonSummary={{
            played: completedMatches.length,
            wins,
            draws,
            losses,
            goalsFor,
            goalsAgainst,
          }}
          recentResults={recentResults}
          upcomingMatches={upcomingMatches}
        />
      </div>
    </Container>
  );
}
