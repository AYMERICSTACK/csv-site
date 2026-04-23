import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

type EducatorCard = {
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
};

const EDUCATOR_CARDS: EducatorCard[] = [
  {
    title: "Gestion des matchs",
    description:
      "Ajouter, modifier et suivre les rencontres du calendrier du club.",
    href: "/admin/matchs",
  },
  {
    title: "Gestion des équipes",
    description:
      "Consulter et modifier les catégories, responsables et créneaux affichés sur la page publique.",
    href: "/espace-educateurs/equipes",
  },
  {
    title: "Mon profil",
    description:
      "Consulter tes informations personnelles et tes préférences de visibilité.",
    href: "/espace-club/profil",
  },
  {
    title: "Planning",
    description: "Structurer les entraînements, créneaux et suivis sportifs.",
    disabled: true,
  },
  {
    title: "Infos club",
    description:
      "Centraliser les informations utiles pour l’encadrement et les consignes.",
    disabled: true,
  },
  {
    title: "Documents",
    description: "Regrouper feuilles de match, documents staff et ressources.",
    disabled: true,
  },
];

export default async function EspaceEducateursPage() {
  const session = await requireRole(["admin", "educateurs"]);

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

                <Link href="/espace-educateurs">
                  <Badge>Éducateurs</Badge>
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
                Espace éducateurs
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Retrouvez ici les accès utiles à l’encadrement sportif et aux
                actions du quotidien. Cet espace devient le point central pour
                suivre les matchs, les équipes et les futurs outils
                d’organisation sportive.
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
                  <Trophy size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">
                    Tableau de bord éducateurs
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Vue d’ensemble des accès et des futurs outils utiles à
                    l’encadrement sportif.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {EDUCATOR_CARDS.map((card) =>
                  card.href ? (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                    >
                      <h3 className="text-sm font-bold text-neutral-900">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm text-neutral-600">
                        {card.description}
                      </p>
                    </Link>
                  ) : (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 opacity-80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-bold text-neutral-900">
                          {card.title}
                        </h3>
                        <span className="rounded-full bg-neutral-200 px-2.5 py-1 text-[11px] font-bold text-neutral-600">
                          À venir
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-600">
                        {card.description}
                      </p>
                    </div>
                  ),
                )}
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
                  admin + educateurs
                </p>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              <h2 className="text-xl font-extrabold tracking-tight">
                Raccourcis utiles
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Accède rapidement aux outils essentiels pour le suivi sportif et
                l’organisation des éducateurs.
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/admin/matchs"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <span>Ouvrir la gestion des matchs</span>
                  <CalendarDays size={16} className="text-orange-400" />
                </Link>

                <Link
                  href="/equipes"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <span>Voir les équipes & horaires</span>
                  <Users size={16} className="text-orange-400" />
                </Link>

                <Link
                  href="/espace-club"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <span>Retour à l’espace club</span>
                  <ShieldCheck size={16} className="text-orange-400" />
                </Link>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-neutral-900">
                Vision éducateurs
              </h2>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                    <ClipboardList size={16} className="text-csv-orange" />
                    Matchs & suivi
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Faciliter le suivi des rencontres et la mise à jour des
                    informations utiles.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                    <Users size={16} className="text-csv-orange" />
                    Organisation des équipes
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Structurer les catégories, responsables et informations
                    d’encadrement.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                    <FolderOpen size={16} className="text-csv-orange" />
                    Ressources à venir
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    Préparer un futur espace central pour les documents,
                    plannings et consignes.
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
