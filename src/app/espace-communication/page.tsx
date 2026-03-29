import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";

async function requireCommunicationAccess() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.user?.role;

  if (role !== "admin" && role !== "communication") {
    redirect("/espace-club/profil");
  }

  return session;
}

export default async function EspaceCommunicationPage() {
  const session = await requireCommunicationAccess();

  return (
    <Container>
      <div className="py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Espace privé</Badge>
              <Badge>Communication</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Espace communication
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Centralise les contenus, publications, visuels et actions de
              communication du club.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-extrabold text-neutral-900">
              Tableau de bord communication
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Cette première version sert de base pour gérer les publications,
              actualités, visuels et campagnes du club.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">
                  Actualités
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Préparer les futurs contenus du site et les annonces du club.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">Réseaux</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Organiser les publications et la visibilité digitale.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">Visuels</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Centraliser affiches, bannières et supports de communication.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">À venir</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Gestion éditoriale, calendrier de contenu et médias.
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
                admin + communication
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
