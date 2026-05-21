import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { CLUB_TEAMS, normalizeTeamName, slugifyTeam } from "@/lib/teams";
import { requireRole } from "@/lib/auth-guard";

type PageProps = {
  params: Promise<{ team: string }>;
};

function initials(firstName: string, lastName: string) {
  return `${firstName[0] || ""}${lastName[0] || ""}`;
}

async function updateTeamFffUrl(formData: FormData) {
  "use server";

  await requireRole(["admin", "educateurs"]);

  const team = String(formData.get("team") || "").trim();
  const fffUrl = String(formData.get("fffUrl") || "").trim();

  if (!team) redirect("/admin/equipes");

  await prisma.teamSetting.upsert({
    where: { team },
    create: {
      team,
      fffUrl: fffUrl || null,
    },
    update: {
      fffUrl: fffUrl || null,
    },
  });

  revalidatePath("/classements");
  revalidatePath(`/admin/equipes/${slugifyTeam(team)}`);
}

export default async function AdminEquipeDetailPage({ params }: PageProps) {
  await requireRole(["admin", "educateurs"]);

  const { team: teamSlug } = await params;
  const season = "2025/2026";

  const teamName = CLUB_TEAMS.find((team) => slugifyTeam(team) === teamSlug);

  if (!teamName) redirect("/admin/equipes");

  const allPlayers = await prisma.player.findMany({
    where: { isActive: true },
    include: {
      stats: {
        where: { season },
        take: 1,
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const allMatches = await prisma.match.findMany({
    orderBy: { matchDate: "desc" },
  });

  const teamSetting = await prisma.teamSetting.findUnique({
    where: { team: teamName },
  });

  const players = allPlayers.filter(
    (player) => normalizeTeamName(player.team) === teamName,
  );

  const matches = allMatches
    .filter((match) => normalizeTeamName(match.team) === teamName)
    .slice(0, 8);

  const topScorers = [...players]
    .sort((a, b) => (b.stats[0]?.goals || 0) - (a.stats[0]?.goals || 0))
    .slice(0, 5);

  const topAssists = [...players]
    .sort((a, b) => (b.stats[0]?.assists || 0) - (a.stats[0]?.assists || 0))
    .slice(0, 5);

  const totalGoals = players.reduce(
    (sum, player) => sum + (player.stats[0]?.goals || 0),
    0,
  );

  const totalAssists = players.reduce(
    (sum, player) => sum + (player.stats[0]?.assists || 0),
    0,
  );

  return (
    <Container>
      <div className="py-14">
        <Link
          href="/admin/equipes"
          className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50"
        >
          ← Retour aux équipes
        </Link>

        <section className="mt-6 rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Équipe
              </div>

              <h1 className="mt-2 text-4xl font-black text-neutral-950">
                {teamName}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
                Gérez l’effectif, suivez les statistiques et retrouvez les
                derniers matchs de cette équipe.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/equipes/${teamSlug}/joueurs`}
                className="rounded-xl bg-csv-black px-4 py-2 text-sm font-bold text-white"
              >
                Gérer les joueurs
              </Link>

              <Link
                href="/admin/matchs"
                className="rounded-xl bg-csv-orange px-4 py-2 text-sm font-bold text-white"
              >
                Gérer les matchs
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-orange-50 p-5">
              <div className="text-xs font-bold uppercase text-orange-700">
                Joueurs
              </div>
              <div className="mt-1 text-3xl font-black">{players.length}</div>
            </div>

            <div className="rounded-2xl bg-neutral-100 p-5">
              <div className="text-xs font-bold uppercase text-neutral-600">
                Matchs
              </div>
              <div className="mt-1 text-3xl font-black">{matches.length}</div>
            </div>

            <div className="rounded-2xl bg-orange-50 p-5">
              <div className="text-xs font-bold uppercase text-orange-700">
                Buts
              </div>
              <div className="mt-1 text-3xl font-black">{totalGoals}</div>
            </div>

            <div className="rounded-2xl bg-neutral-950 p-5 text-white">
              <div className="text-xs font-bold uppercase text-white/70">
                Passes
              </div>
              <div className="mt-1 text-3xl font-black">{totalAssists}</div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-neutral-950">Effectif</h2>

            <div className="mt-5 grid gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-2xl border border-neutral-200 p-4"
                >
                  {player.photoConsent && player.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-lg font-black text-neutral-500">
                      {initials(player.firstName, player.lastName)}
                    </div>
                  )}

                  <div>
                    <div className="font-black text-neutral-950">
                      {player.firstName} {player.lastName}
                    </div>
                    <div className="text-xs font-semibold text-neutral-500">
                      {player.category || "Catégorie non renseignée"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                      {player.stats[0]?.goals || 0} B
                    </span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
                      {player.stats[0]?.assists || 0} P
                    </span>
                  </div>
                </div>
              ))}

              {!players.length && (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm font-semibold text-neutral-500">
                  Aucun joueur actif dans cette équipe.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm">
              <div className="bg-neutral-950 p-5 text-white">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                  Lien officiel
                </div>
                <h3 className="mt-1 text-lg font-black">Classement FFF</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/65">
                  Collez ici le lien précis de l’équipe sur le site FFF. Pour
                  supprimer le lien, videz le champ puis enregistrez.
                </p>
              </div>

              <form action={updateTeamFffUrl} className="space-y-4 p-5">
                <input type="hidden" name="team" value={teamName} />

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-neutral-500">
                    URL FFF de {teamName}
                  </label>
                  <input
                    name="fffUrl"
                    type="url"
                    defaultValue={teamSetting?.fffUrl || ""}
                    placeholder="https://epreuves.fff.fr/..."
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-csv-orange px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600"
                  >
                    Enregistrer
                  </button>

                  {teamSetting?.fffUrl ? (
                    <a
                      href={teamSetting.fffUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Voir FFF
                    </a>
                  ) : null}
                </div>
              </form>
            </section>

            <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-neutral-950">
                Classements équipe
              </h3>

              <div className="mt-5 rounded-2xl bg-orange-50 p-4">
                <div className="text-sm font-black uppercase text-orange-700">
                  Top buteurs
                </div>
                <div className="mt-3 space-y-2">
                  {topScorers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex justify-between rounded-xl bg-white px-3 py-2 text-sm"
                    >
                      <span className="font-bold">
                        {index + 1}. {player.firstName} {player.lastName}
                      </span>
                      <span className="font-black text-orange-700">
                        {player.stats[0]?.goals || 0}
                      </span>
                    </div>
                  ))}

                  {!topScorers.length && (
                    <div className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-neutral-500">
                      Aucun buteur.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-100 p-4">
                <div className="text-sm font-black uppercase text-neutral-700">
                  Top passeurs
                </div>
                <div className="mt-3 space-y-2">
                  {topAssists.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex justify-between rounded-xl bg-white px-3 py-2 text-sm"
                    >
                      <span className="font-bold">
                        {index + 1}. {player.firstName} {player.lastName}
                      </span>
                      <span className="font-black text-neutral-900">
                        {player.stats[0]?.assists || 0}
                      </span>
                    </div>
                  ))}

                  {!topAssists.length && (
                    <div className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-neutral-500">
                      Aucun passeur.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-neutral-950">
                Derniers matchs
              </h3>

              <div className="mt-4 space-y-3">
                {matches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/admin/matchs/${match.id}/edit`}
                    className="block rounded-2xl border border-neutral-200 p-4 transition hover:border-orange-200 hover:bg-orange-50/30"
                  >
                    <div className="text-sm font-black text-neutral-950">
                      {normalizeTeamName(match.team)} vs {match.opponent}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-neutral-500">
                      {new Date(match.matchDate).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="mt-2 text-sm font-black text-csv-orange">
                      {match.scoreTeam ?? "-"} - {match.scoreOpponent ?? "-"}
                    </div>
                  </Link>
                ))}

                {!matches.length && (
                  <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm font-semibold text-neutral-500">
                    Aucun match enregistré.
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </Container>
  );
}
