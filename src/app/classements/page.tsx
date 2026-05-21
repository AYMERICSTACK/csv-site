export const revalidate = 300;

import Container from "@/components/Container";
import PublicRankingsBoard from "@/components/PublicRankingsBoard";
import { prisma } from "@/lib/prisma";

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
  const season = "2025/2026";

  const players = await prisma.player.findMany({
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
  });

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

  const teamSettings = await prisma.teamSetting.findMany();

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
        />
      </div>
    </Container>
  );
}
