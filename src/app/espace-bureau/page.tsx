import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";

async function requireBureauAccess() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.user?.role;

  if (role !== "admin" && role !== "bureau") {
    redirect("/espace-club/profil");
  }

  return session;
}

export default async function EspaceBureauPage() {
  const session = await requireBureauAccess();

  return (
    <Container>
      <div className="py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Espace privé</Badge>
              <Badge>Bureau</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Espace bureau
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Organise les informations de pilotage, coordination et suivi
              global du club.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-extrabold text-neutral-900">
              Tableau de bord bureau
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Cet espace servira à suivre les sujets transverses, réunions et
              décisions du bureau.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">Pilotage</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Centraliser les sujets de coordination du club.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">Réunions</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Structurer les prochains comptes-rendus et suivis bureau.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">
                  Décisions
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Suivre les orientations et priorités du club.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <h3 className="text-sm font-bold text-neutral-900">À venir</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Documents internes, suivi annuel et gouvernance.
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
                admin + bureau
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
