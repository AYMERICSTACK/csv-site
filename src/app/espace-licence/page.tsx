import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";
import { ArrowLeft, IdCard } from "lucide-react";

export default async function EspaceLicencePage() {
  const { user } = await requireRole(["admin", "licence"]);

  const role = user.role;
  const dashboardHref = role === "admin" ? "/admin" : "/espace-club";
  const dashboardLabel =
    role === "admin" ? "Retour dashboard admin" : "Retour espace club";

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 px-6 py-8 shadow-sm md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.18),transparent_26%)]" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={dashboardHref}>
                  <Badge>Espace privé</Badge>
                </Link>
                <Badge>Licence</Badge>
              </div>

              <div className="mt-4">
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={14} />
                  {dashboardLabel}
                </Link>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Espace licence
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Centralise le suivi des licences, inscriptions, dossiers joueurs
                et démarches administratives du club.
              </p>
            </div>

            <AdminLogoutButton />
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-csv-orange">
              <IdCard size={20} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-neutral-900">
                Tableau de bord licence
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                Cet espace pourra accueillir le suivi des demandes, pièces
                manquantes, renouvellements et validations.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Container>
  );
}
