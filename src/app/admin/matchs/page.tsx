import { requireRole } from "@/lib/auth-guard";
import { auth } from "@/auth";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import AdminMatchesBoard from "@/components/AdminMatchesBoard";
import { ArrowLeft, Plus } from "lucide-react";

async function refreshPlayerStats(playerIds: string[]) {
  const season = "2025/2026";
  const uniquePlayerIds = Array.from(new Set(playerIds)).filter(Boolean);

  for (const playerId of uniquePlayerIds) {
    const goals = await prisma.matchEvent.count({
      where: { playerId, type: "GOAL" },
    });

    const assists = await prisma.matchEvent.count({
      where: { playerId, type: "ASSIST" },
    });

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
  }
}

async function deleteMatch(formData: FormData) {
  "use server";

  await requireRole(["admin", "educateurs"]);

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("ID du match manquant.");
  }

  const events = await prisma.matchEvent.findMany({
    where: { matchId: id },
    select: { playerId: true },
  });

  await prisma.match.delete({ where: { id } });
  await refreshPlayerStats(events.map((event) => event.playerId));

  revalidatePath("/");
  revalidatePath("/admin/matchs");
  revalidatePath("/calendrier");
  revalidatePath("/classements");
}

export default async function AdminMatchsPage() {
  const { availableRoles, user } = await requireRole(["admin", "educateurs"]);

  const session = await auth();

  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          favoriteTeam: {
            select: {
              category: true,
              coach: true,
            },
          },
        },
      })
    : null;

  const favoriteTeam = currentUser?.favoriteTeam ?? null;

  const role = availableRoles.includes("admin") ? "admin" : user.role;
  const backHref = role === "admin" ? "/admin" : "/espace-club";
  const backLabel = role === "admin" ? "Retour admin" : "Retour espace club";

  const matches = await prisma.match.findMany({
    orderBy: { matchDate: "desc" },
  });

  const sortedMatches = [...matches].sort((a, b) => {
    if (!favoriteTeam) return 0;

    const aFavorite = a.team === favoriteTeam.category;
    const bFavorite = b.team === favoriteTeam.category;

    return Number(bFavorite) - Number(aFavorite);
  });

  const upcomingMatches = matches.filter(
    (match) => match.status !== "finished" && match.status !== "cancelled",
  );

  const finishedMatches = matches.filter(
    (match) => match.status === "finished",
  );

  const serializedMatches = sortedMatches.map((match) => ({
    ...match,
    matchDate: match.matchDate.toISOString(),
  }));

  return (
    <Container>
      <div className="pb-28 pt-6 md:py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 px-5 py-6 shadow-sm md:px-8 md:py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
          <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={backHref}>
                  <Badge>{role === "admin" ? "Admin" : "Espace club"}</Badge>
                </Link>

                <Link href="/admin/matchs">
                  <Badge>Matchs</Badge>
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={14} />
                  {backLabel}
                </Link>

                <Link
                  href="/admin/matchs/new?noFavorite=1"
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white shadow-sm transition hover:bg-orange-400 md:hidden"
                >
                  <Plus size={14} />
                  Ajouter
                </Link>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Gestion des matchs
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Tous les matchs sont accessibles directement. Sur téléphone,
                ajoute une rencontre avec le bouton flottant puis gère les
                résultats, buteurs et passeurs depuis les fiches.
              </p>
            </div>

            <div className="relative flex flex-col items-start gap-4 md:items-end">
              <AdminLogoutButton />

              <div className="grid w-full grid-cols-3 gap-2 text-white md:w-auto">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <div className="text-2xl font-black">{matches.length}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-white/55">
                    Matchs
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <div className="text-2xl font-black">
                    {upcomingMatches.length}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-white/55">
                    À venir
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <div className="text-2xl font-black">
                    {finishedMatches.length}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-white/55">
                    Terminés
                  </div>
                </div>
              </div>

              <Link
                href="/admin/matchs/new?noFavorite=1"
                className="hidden items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-400 md:inline-flex"
              >
                <Plus size={18} />
                Ajouter un match
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 md:mt-8">
          {favoriteTeam && (
            <section className="mb-6 rounded-[1.75rem] border border-orange-200 bg-orange-50 p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-orange-700">
                    ⭐ Équipe favorite
                  </div>

                  <h2 className="mt-3 text-2xl font-black text-neutral-950">
                    {favoriteTeam.category}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-600">
                    Les matchs de cette équipe sont affichés en priorité.
                  </p>
                </div>

                <Link
                  href="/admin/matchs/new"
                  className="inline-flex items-center justify-center rounded-xl bg-csv-black px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  Ajouter un match
                </Link>
              </div>
            </section>
          )}

          <AdminMatchesBoard
            matches={serializedMatches}
            deleteAction={deleteMatch}
            createHref="/admin/matchs/new?noFavorite=1"
          />
        </div>

        <Link
          href="/admin/matchs/new?noFavorite=1"
          aria-label="Ajouter un match"
          className="fixed bottom-5 right-5 z-40 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-2xl shadow-orange-500/35 ring-4 ring-white transition active:scale-95 md:hidden"
        >
          <Plus size={28} strokeWidth={3} />
        </Link>
      </div>
    </Container>
  );
}
