import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";

export default async function EspaceFestivitePage() {
  const session = await requireRole(["admin", "festivite"]);

  return (
    <Container>
      <div className="py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Espace privé</Badge>
              <Badge>Festivité</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Espace festivité
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Prépare les événements, animations et temps forts de la vie du
              club.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-extrabold text-neutral-900">
              Tableau de bord festivité
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Cette base servira à organiser les événements et opérations
              conviviales du club.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">
                  Événements
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Préparer les temps forts, soirées et animations.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">Planning</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Structurer les dates et besoins d’organisation.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">Équipes</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Répartir les rôles et tâches sur les événements.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">À venir</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Budget, ressources et suivi des opérations.
                </p>
              </div>
            </div>
          </div>

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
                admin + festivite
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
