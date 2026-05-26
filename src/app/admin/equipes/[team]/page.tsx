import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { CLUB_TEAMS, normalizeTeamName, slugifyTeam } from "@/lib/teams";

type PageProps = {
  params: Promise<{ team: string }>;
  searchParams?: Promise<{ view?: string }>;
};

const POSITION_LABELS: Record<string, string> = {
  GK: "Gardien",
  DEF: "Défenseur",
  MID: "Milieu",
  ATT: "Attaquant",
};

const POSITION_SIDE_LABELS: Record<string, string> = {
  G: "Gauche",
  C: "Centre",
  D: "Droite",
  DG: "Latéral gauche",
  DC: "Défenseur central",
  DD: "Latéral droit",
  MDC: "Milieu défensif",
  MC: "Milieu relayeur",
  MOC: "Milieu offensif",
  AG: "Ailier gauche",
  AD: "Ailier droit",
  BU: "Avant-centre",
};

const PITCH_POSITION_SIDES = [
  "DG",
  "DC",
  "DD",
  "MDC",
  "MC",
  "MOC",
  "AG",
  "AD",
  "BU",
] as const;

type TeamPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  category: string | null;
  position: string | null;
  positionSide: string | null;
  sortOrder: number | null;
  photoUrl: string | null;
  photoConsent: boolean | null;
  stats: { goals: number; assists: number }[];
};

function getPositionLabel(position?: string | null) {
  if (!position) return "Poste non renseigné";
  return POSITION_LABELS[position] || position;
}

function getPositionSideLabel(positionSide?: string | null) {
  if (!positionSide) return null;
  return POSITION_SIDE_LABELS[positionSide] || positionSide;
}

function sortPlayersForPitch(players: TeamPlayer[]) {
  return [...players].sort((a, b) => {
    const sortA = a.sortOrder ?? 999;
    const sortB = b.sortOrder ?? 999;

    if (sortA !== sortB) return sortA - sortB;

    const sideCompare = (a.positionSide || "").localeCompare(
      b.positionSide || "",
    );

    if (sideCompare !== 0) return sideCompare;

    const lastNameCompare = a.lastName.localeCompare(b.lastName);

    if (lastNameCompare !== 0) return lastNameCompare;

    return a.firstName.localeCompare(b.firstName);
  });
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] || ""}${lastName[0] || ""}`;
}

function PlayerAvatar({ player }: { player: TeamPlayer }) {
  if (player.photoConsent && player.photoUrl) {
    return (
      <img
        src={player.photoUrl}
        alt={`${player.firstName} ${player.lastName}`}
        className="h-14 w-14 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-lg font-black text-neutral-500">
      {initials(player.firstName, player.lastName)}
    </div>
  );
}

function formatCompositionName(player: TeamPlayer) {
  const firstName = player.firstName.trim();
  const lastInitial = player.lastName.trim()[0];

  if (!lastInitial) return firstName;

  return `${firstName}.${lastInitial.toUpperCase()}`;
}

function CompositionPlayerCard({ player }: { player: TeamPlayer }) {
  const sideLabel = getPositionSideLabel(player.positionSide);
  const displayName = formatCompositionName(player);
  const fullName = `${player.firstName} ${player.lastName}`;

  return (
    <div className="mx-auto grid h-[92px] w-full min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-white/20 bg-white/95 p-2 text-neutral-950 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 text-xs font-black text-neutral-500">
        {player.photoConsent && player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          initials(player.firstName, player.lastName)
        )}
      </div>

      <div className="min-w-0 overflow-hidden">
        <div
          title={fullName}
          className="truncate text-[11px] font-black leading-tight tracking-tight text-neutral-950 sm:text-xs"
        >
          {displayName}
        </div>

        <div className="mt-1 space-y-0.5">
          <div className="truncate text-[9px] font-black leading-tight text-orange-700">
            {getPositionLabel(player.position)}
          </div>

          {sideLabel ? (
            <div className="truncate text-[9px] font-black leading-tight text-neutral-700">
              {sideLabel}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PitchSlot({
  title,
  players,
  compact = false,
}: {
  title: string;
  players: TeamPlayer[];
  compact?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-[1.35rem] border border-white/15 bg-white/10 p-2 backdrop-blur ${
        compact ? "min-h-[126px]" : "min-h-[140px]"
      }`}
    >
      <div className="mb-2 text-center text-[11px] font-black uppercase tracking-wide text-emerald-50/80">
        {title}
      </div>

      {players.length ? (
        <div className="space-y-2">
          {players.map((player) => (
            <CompositionPlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[58px] items-center justify-center rounded-2xl border border-dashed border-white/20 px-2 text-center text-xs font-bold text-white/45">
          Aucun joueur
        </div>
      )}
    </div>
  );
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

export default async function AdminEquipeDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requireRole(["admin", "educateurs"]);

  const { team: teamSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const activeView = resolvedSearchParams?.view === "compo" ? "compo" : "liste";
  const season = "2025/2026";

  const teamName = CLUB_TEAMS.find((team) => slugifyTeam(team) === teamSlug);

  if (!teamName) redirect("/admin/equipes");

  const normalizedCurrentTeam = normalizeTeamName(teamName);

  const allPlayers = await prisma.player.findMany({
    where: { isActive: true },
    include: {
      stats: {
        where: { season },
        take: 1,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
  });

  const allMatches = await prisma.match.findMany({
    orderBy: { matchDate: "desc" },
  });

  const teamSetting = await prisma.teamSetting.findUnique({
    where: { team: teamName },
  });

  const players = allPlayers.filter(
    (player) => normalizeTeamName(player.team || "") === normalizedCurrentTeam,
  );

  const matches = allMatches
    .filter(
      (match) => normalizeTeamName(match.team || "") === normalizedCurrentTeam,
    )
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

  const getPitchPlayers = (positionSide: string) =>
    sortPlayersForPitch(
      players.filter((player) => player.positionSide === positionSide),
    );

  const goalkeeperPlayers = sortPlayersForPitch(
    players.filter((player) => player.position === "GK"),
  );

  const assignedPitchSideSet = new Set<string>(PITCH_POSITION_SIDES);

  const unassignedPlayers = sortPlayersForPitch(
    players.filter(
      (player) =>
        player.position !== "GK" &&
        (!player.positionSide ||
          !assignedPitchSideSet.has(player.positionSide)),
    ),
  );

  return (
    <Container>
      <div className="pb-24 pt-6 sm:py-14">
        <Link
          href="/admin/equipes"
          className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50"
        >
          ← Retour aux équipes
        </Link>

        <section className="mt-5 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:mt-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Équipe
              </div>

              <h1 className="mt-2 text-3xl font-black text-neutral-950 sm:text-4xl">
                {teamName}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
                Gérez l’effectif, suivez les statistiques et retrouvez les
                derniers matchs de cette équipe.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link
                href={`/admin/equipes/${teamSlug}/joueurs`}
                className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-3 text-sm font-bold text-white sm:py-2"
              >
                Gérer les joueurs
              </Link>

              <Link
                href="/admin/matchs"
                className="inline-flex items-center justify-center rounded-xl bg-csv-orange px-4 py-3 text-sm font-bold text-white sm:py-2"
              >
                Gérer les matchs
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 md:grid-cols-4">
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

        <div className="mt-6 grid gap-5 sm:mt-8 xl:grid-cols-[1fr_340px]">
          <section className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-neutral-950">
                  Effectif
                </h2>
                <p className="mt-1 text-sm font-semibold text-neutral-500">
                  Basculez entre la liste classique et la vue compo pour lire le
                  groupe comme un coach.
                </p>
              </div>

              <div className="grid grid-cols-2 rounded-2xl bg-neutral-100 p-1 text-sm font-black">
                <Link
                  href={`/admin/equipes/${teamSlug}`}
                  className={`rounded-xl px-4 py-2 text-center transition ${
                    activeView === "liste"
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Liste
                </Link>

                <Link
                  href={`/admin/equipes/${teamSlug}?view=compo`}
                  className={`rounded-xl px-4 py-2 text-center transition ${
                    activeView === "compo"
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Compo
                </Link>
              </div>
            </div>

            {activeView === "liste" ? (
              <div className="mt-5 grid gap-3">
                {players.map((player) => {
                  const sideLabel = getPositionSideLabel(player.positionSide);

                  return (
                    <div
                      key={player.id}
                      className="grid grid-cols-[52px_1fr] gap-3 rounded-2xl border border-neutral-200 p-3 sm:grid-cols-[56px_1fr_auto] sm:items-center sm:gap-4 sm:p-4"
                    >
                      <PlayerAvatar player={player} />

                      <div>
                        <div className="font-black text-neutral-950">
                          {player.firstName} {player.lastName}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-black text-neutral-600">
                            {player.category || "Catégorie non renseignée"}
                          </span>

                          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-black text-orange-700">
                            {getPositionLabel(player.position)}
                          </span>

                          {sideLabel ? (
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-black text-neutral-700">
                              {sideLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="col-span-2 flex gap-2 sm:col-span-1">
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                          {player.stats[0]?.goals || 0} B
                        </span>

                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
                          {player.stats[0]?.assists || 0} P
                        </span>
                      </div>
                    </div>
                  );
                })}

                {!players.length && (
                  <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm font-semibold text-neutral-500">
                    Aucun joueur actif dans cette équipe.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-b from-emerald-700 to-emerald-950 p-4 text-white shadow-inner sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100/80">
                      Vue compo
                    </div>

                    <h3 className="mt-1 text-2xl font-black">{teamName}</h3>
                  </div>

                  <Link
                    href={`/admin/equipes/${teamSlug}/joueurs`}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
                  >
                    Modifier les postes
                  </Link>
                </div>

                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-emerald-800/70 p-3 shadow-inner sm:p-5">
                  <div className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-white/15" />
                  <div className="pointer-events-none absolute left-1/2 top-3 h-[calc(100%-1.5rem)] w-px -translate-x-1/2 bg-white/10" />
                  <div className="pointer-events-none absolute left-3 top-1/2 h-px w-[calc(100%-1.5rem)] -translate-y-1/2 bg-white/10" />
                  <div className="pointer-events-none absolute left-1/2 top-[42%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

                  <div className="relative z-10 space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-start">
                      <div className="hidden sm:block" />
                      <PitchSlot
                        title="Avant-centre"
                        players={getPitchPlayers("BU")}
                      />
                      <div className="hidden sm:block" />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-start">
                      <PitchSlot
                        title="Ailier gauche"
                        players={getPitchPlayers("AG")}
                        compact
                      />
                      <div className="hidden sm:block" />
                      <PitchSlot
                        title="Ailier droit"
                        players={getPitchPlayers("AD")}
                        compact
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-start">
                      <PitchSlot
                        title="Milieu défensif"
                        players={getPitchPlayers("MDC")}
                        compact
                      />
                      <PitchSlot
                        title="Milieu relayeur"
                        players={getPitchPlayers("MC")}
                        compact
                      />
                      <PitchSlot
                        title="Milieu offensif"
                        players={getPitchPlayers("MOC")}
                        compact
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-start">
                      <PitchSlot
                        title="Latéral gauche"
                        players={getPitchPlayers("DG")}
                        compact
                      />

                      <div>
                        <PitchSlot
                          title="Défenseurs centraux"
                          players={getPitchPlayers("DC")}
                          compact
                        />
                      </div>

                      <PitchSlot
                        title="Latéral droit"
                        players={getPitchPlayers("DD")}
                        compact
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-start">
                      <div className="hidden sm:block" />
                      <PitchSlot title="Gardien" players={goalkeeperPlayers} />
                      <div className="hidden sm:block" />
                    </div>
                  </div>
                </div>

                {unassignedPlayers.length ? (
                  <div className="mt-4 rounded-[1.5rem] border border-amber-200/30 bg-amber-100/15 p-4">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="text-lg font-black">
                          Poste à compléter
                        </div>

                        <div className="text-xs font-bold text-white/65">
                          Ces joueurs ont un poste général ou incomplet.
                        </div>
                      </div>

                      <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                        {unassignedPlayers.length}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {unassignedPlayers.map((player) => (
                        <CompositionPlayerCard
                          key={player.id}
                          player={player}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {!players.length && (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm font-bold text-white/65">
                    Aucun joueur actif dans cette équipe.
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
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
                    className="block rounded-2xl border border-neutral-200 p-3 transition hover:border-orange-200 hover:bg-orange-50/30 sm:p-4"
                  >
                    <div className="text-sm font-black text-neutral-950">
                      {normalizeTeamName(match.team || "")} vs {match.opponent}
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

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_-20px_rgba(0,0,0,0.35)] backdrop-blur md:hidden">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/admin/equipes/${teamSlug}/joueurs`}
              className="inline-flex items-center justify-center rounded-2xl bg-csv-black px-4 py-3 text-sm font-black text-white"
            >
              Joueurs
            </Link>

            <Link
              href="/admin/matchs"
              className="inline-flex items-center justify-center rounded-2xl bg-csv-orange px-4 py-3 text-sm font-black text-white"
            >
              Matchs
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
