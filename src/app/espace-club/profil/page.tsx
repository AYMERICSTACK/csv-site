import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import ProfileVisibilityForm from "@/components/ProfileVisibilityForm";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      staffMembers: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!user) {
    return <div className="p-6">Utilisateur introuvable</div>;
  }

  const firstVisibleEmail =
    user.staffMembers.find((member) => member.email)?.email || undefined;

  const firstVisiblePhone =
    user.staffMembers.find((member) => member.phone)?.phone || undefined;

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
          <h1 className="text-2xl font-bold text-neutral-900">
            Compte de la commission
          </h1>
          <p className="text-sm text-neutral-500">
            Consulte les informations du compte connecté et les membres liés à
            cette commission.
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
        <h2 className="text-lg font-semibold">Membres de la commission</h2>

        {user.staffMembers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {user.staffMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="text-base font-semibold text-neutral-900">
                  {member.name}
                </div>

                <div className="mt-2 space-y-1 text-sm text-neutral-700">
                  <p>
                    <strong>Rôle :</strong> {member.roleLabel}
                  </p>
                  <p>
                    <strong>Section :</strong> {member.sectionTitle}
                  </p>
                  <p>
                    <strong>Email :</strong> {member.email || "—"}
                  </p>
                  <p>
                    <strong>Téléphone :</strong> {member.phone || "—"}
                  </p>
                  <p>
                    <strong>Statut :</strong>{" "}
                    {member.isPublished ? "Publié" : "Masqué"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Aucun membre staff lié à ce compte pour le moment.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Visibilité des informations
        </h2>

        <ProfileVisibilityForm
          showEmailToMembers={user.showEmailToMembers}
          showPhoneToMembers={user.showPhoneToMembers}
          staffEmail={firstVisibleEmail}
          staffPhone={firstVisiblePhone}
        />
      </div>
    </div>
  );
}
