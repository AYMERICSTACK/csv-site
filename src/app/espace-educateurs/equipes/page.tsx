import Link from "next/link";
import Container from "@/components/Container";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import TeamsBoardClient from "./TeamsBoardClient";

export default async function EspaceEducateursEquipesPage() {
  await requireRole(["admin", "educateurs"]);

  const groups = await prisma.teamGroup.findMany({
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      teams: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          schedules: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },
  });

  return (
    <Container>
      <div className="py-14">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/espace-club"
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  Espace club
                </Link>

                <Link
                  href="/espace-educateurs"
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  Commission éducateurs
                </Link>

                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
                  Gestion des équipes
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
                Gestion des équipes
              </h1>

              <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
                Consulte, réorganise et mets à jour les catégories affichées sur
                la page publique des équipes.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/espace-educateurs/equipes/new"
                className="inline-flex items-center justify-center rounded-2xl bg-csv-orange px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Ajouter une équipe
              </Link>

              <AdminLogoutButton />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <TeamsBoardClient groups={groups} />
        </div>
      </div>
    </Container>
  );
}
