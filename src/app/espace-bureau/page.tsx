import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ClipboardList,
  Files,
  Scale,
} from "lucide-react";

export default async function EspaceBureauPage() {
  const { user } = await requireRole(["admin", "bureau"]);

  const role = user.role;
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

                <Link href="/espace-bureau">
                  <Badge>Bureau</Badge>
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
                Espace bureau
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Organise les informations de pilotage, coordination et suivi
                global du club. Cet espace est destiné à structurer les sujets
                transverses et les grandes orientations du bureau.
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
                  <BriefcaseBusiness size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">
                    Tableau de bord bureau
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Vue d’ensemble des grands sujets de coordination, de
                    gouvernance et de suivi stratégique du club.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <ClipboardList size={16} className="text-csv-orange" />
                    <h3 className="text-sm font-bold">Pilotage</h3>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Centraliser les sujets de coordination du club.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Files size={16} className="text-csv-orange" />
                    <h3 className="text-sm font-bold">Réunions</h3>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Structurer les prochains comptes-rendus et suivis bureau.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Scale size={16} className="text-csv-orange" />
                    <h3 className="text-sm font-bold">Décisions</h3>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Suivre les orientations et priorités du club.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <BriefcaseBusiness size={16} className="text-csv-orange" />
                    <h3 className="text-sm font-bold">À venir</h3>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Documents internes, suivi annuel et gouvernance.
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
                  {user.name || user.email || "Utilisateur"}
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">Rôle :</span>{" "}
                  {user.role}
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">
                    Espace autorisé :
                  </span>{" "}
                  admin + bureau
                </p>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              <h2 className="text-xl font-extrabold tracking-tight">
                Cap bureau
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Cet espace servira à piloter les grands sujets du club avec une
                vision claire, structurée et centralisée.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">
                    Coordination
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Préparer un point central sur les sujets transverses du
                    club.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">Suivi</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Structurer les prochaines étapes, priorités et validations.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">
                    Gouvernance
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Poser les bases des documents internes et du pilotage
                    annuel.
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
