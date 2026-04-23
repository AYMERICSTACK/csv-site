import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";
import {
  ArrowLeft,
  Beer,
  Boxes,
  CalendarDays,
  ClipboardList,
  Users,
} from "lucide-react";

export default async function EspaceBuvettePage() {
  const session = await requireRole(["admin", "buvette"]);

  const role = session.user?.role;
  const dashboardHref = role === "admin" ? "/admin" : "/espace-club";
  const dashboardLabel =
    role === "admin" ? "Retour dashboard admin" : "Retour espace club";

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 px-6 py-8 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.55)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.10),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={dashboardHref}>
                  <Badge>Espace privé</Badge>
                </Link>

                <Link href="/espace-buvette">
                  <Badge>Buvette</Badge>
                </Link>
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
                Espace buvette
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Organise la gestion opérationnelle de la buvette, les besoins
                liés aux jours d’événements et la coordination terrain sur les
                temps forts du club.
              </p>
            </div>

            <AdminLogoutButton />
          </div>
        </section>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-csv-orange">
                  <Beer size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">
                    Tableau de bord buvette
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Vue d’ensemble de l’organisation de la buvette et des
                    besoins logistiques autour des événements du club.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Boxes size={16} className="text-csv-orange" />
                    <h3 className="text-sm font-bold">Stocks</h3>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Préparer le suivi des produits, consommables et besoins.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Users size={16} className="text-csv-orange" />
                    <h3 className="text-sm font-bold">Présences</h3>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Structurer la répartition des personnes sur les événements.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <CalendarDays size={16} className="text-csv-orange" />
                    <h3 className="text-sm font-bold">Jours de match</h3>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Centraliser les besoins et l’organisation terrain.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <ClipboardList size={16} className="text-csv-orange" />
                    <h3 className="text-sm font-bold">À venir</h3>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Stocks, équipes, planning et suivi de la buvette.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-neutral-900">Accès</h2>

              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <p>
                  <span className="font-semibold text-neutral-900">
                    Connecté :
                  </span>{" "}
                  {session.user?.name || session.user?.email || "Utilisateur"}
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">Rôle :</span>{" "}
                  {session.user?.role}
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">
                    Espace autorisé :
                  </span>{" "}
                  admin + buvette
                </p>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              <h2 className="text-xl font-extrabold tracking-tight">
                Cap buvette
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Cet espace servira à organiser une buvette claire, fluide et
                bien préparée lors des matchs et événements du club.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">
                    Organisation
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Structurer les besoins, les rôles et les temps forts de la
                    buvette.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">
                    Anticipation
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Préparer les stocks et les besoins matériels à l’avance.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">Terrain</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Faciliter la coordination le jour J pour une organisation
                    plus fluide.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Container>
  );
}
