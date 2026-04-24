import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import ProfileVisibilityForm from "@/components/ProfileVisibilityForm";
import ProfileInfoForm from "@/components/ProfileInfoForm";
import ProfilePasswordForm from "@/components/ProfilePasswordForm";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        orderBy: [{ isAdmin: "desc" }, { commission: { name: "asc" } }],
        include: {
          commission: {
            select: {
              id: true,
              name: true,
              slug: true,
              showEmail: true,
              showPhone: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return <div className="p-6">Utilisateur introuvable</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link
            href="/espace-club"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            ← Retour espace club
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Mon profil</h1>
          <p className="text-sm text-neutral-500">
            Consulte les informations du compte connecté et tes commissions.
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Compte connecté</h2>

        <div className="space-y-1 text-sm text-neutral-700">
          <p>
            <strong>Nom :</strong> {user.name}
          </p>
          <p>
            <strong>Email :</strong> {user.email}
          </p>
          <p>
            <strong>Rôle :</strong> {user.role}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Mes commissions</h2>

        {user.memberships.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {user.memberships.map((membership) => (
              <div
                key={membership.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="text-base font-semibold text-neutral-900">
                  {membership.commission.name}
                </div>

                <div className="mt-2 space-y-1 text-sm text-neutral-700">
                  <p>
                    <strong>Rôle :</strong> {membership.roleLabel || "Membre"}
                  </p>
                  <p>
                    <strong>Statut :</strong>{" "}
                    {membership.isAdmin ? "Admin commission" : "Membre"}
                  </p>
                  <p>
                    <strong>Visible dans la commission :</strong>{" "}
                    {membership.isVisibleInCommission ? "Oui" : "Non"}
                  </p>
                  <p>
                    <strong>Email autorisé par la commission :</strong>{" "}
                    {membership.commission.showEmail ? "Oui" : "Non"}
                  </p>
                  <p>
                    <strong>Téléphone autorisé par la commission :</strong>{" "}
                    {membership.commission.showPhone ? "Oui" : "Non"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Aucune commission liée à ce compte pour le moment.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Mes informations</h2>

        <ProfileInfoForm
          name={user.name}
          email={user.email}
          phone={user.phone}
        />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Sécurité du compte</h2>

        <ProfilePasswordForm />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Visibilité des informations
        </h2>

        <ProfileVisibilityForm
          showEmailToMembers={user.showEmailToMembers}
          showPhoneToMembers={user.showPhoneToMembers}
          userEmail={user.email}
          userPhone={user.phone}
        />
      </div>
    </div>
  );
}
