import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { getHomePathByRole } from "@/lib/roles";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.user?.role;

  if (role !== "admin") {
    redirect(getHomePathByRole(role));
  }

  return (
    <Container>
      <div className="py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Admin</Badge>
              <Badge>Dashboard</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Tableau de bord central
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Accède rapidement aux espaces de gestion du site CS Viriat.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <a
            href="/admin/matchs"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Administration
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Gestion des matchs
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Ajouter, modifier et supprimer les matchs du club.
            </p>
          </a>

          <a
            href="/espace-sponsoring"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Commission
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Sponsoring
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Gérer les partenaires et leur visibilité.
            </p>
          </a>

          <a
            href="/espace-communication"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Commission
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Communication
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Organiser les contenus, visuels et publications du club.
            </p>
          </a>

          <a
            href="/espace-bureau"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Commission
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Bureau
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Coordonner les sujets transverses et le pilotage du club.
            </p>
          </a>

          <a
            href="/espace-materiel"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Commission
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Matériel
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Structurer les équipements et le suivi du matériel.
            </p>
          </a>

          <a
            href="/espace-festivite"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Commission
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Festivité
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Préparer les événements et animations du club.
            </p>
          </a>

          <a
            href="/espace-educateurs"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Commission
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Éducateurs
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Centraliser les informations utiles aux éducateurs.
            </p>
          </a>

          <a
            href="/espace-buvette"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Commission
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Buvette
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Préparer l’organisation et les besoins de la buvette.
            </p>
          </a>

          <a
            href="/espace-club/profil"
            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Utilisateur
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Mon profil
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Consulter et modifier tes informations personnelles.
            </p>
          </a>
        </div>
      </div>
    </Container>
  );
}
