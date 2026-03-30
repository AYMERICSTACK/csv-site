import Link from "next/link";
import Container from "@/components/Container";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";

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

  return (
    <Container>
      <div className="py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/espace-club"
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Espace club
              </Link>

              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700">
                Commission éducateurs
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Espace éducateurs
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Retrouvez ici les accès utiles à l’encadrement sportif et aux
              actions du quotidien.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-neutral-900">
              Tableau de bord éducateurs
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Cet espace devient le point central des éducateurs pour suivre les
              matchs, consulter les équipes et préparer les futurs outils
              d’organisation sportive.
            </p>

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
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 opacity-75"
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
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
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
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-neutral-900">
                Raccourcis utiles
              </h2>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/admin/matchs"
                  className="inline-flex items-center justify-center rounded-2xl bg-csv-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Ouvrir la gestion des matchs
                </Link>

                <Link
                  href="/equipes"
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                >
                  Voir les équipes & horaires
                </Link>

                <Link
                  href="/espace-club"
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                >
                  Retour à l’espace club
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
