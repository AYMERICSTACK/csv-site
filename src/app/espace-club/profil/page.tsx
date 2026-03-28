import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import ProfileVisibilityForm from "@/components/ProfileVisibilityForm";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.email) {
    return <div className="p-6">Non connecté</div>;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      staffMember: true,
    },
  });

  if (!user) {
    return <div className="p-6">Utilisateur introuvable</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Mon profil</h1>
        <p className="text-sm text-neutral-500">
          Gérez vos informations et préférences de visibilité
        </p>
      </div>

      {/* COMPTE */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold">Compte</h2>

        <div className="text-sm text-neutral-700 space-y-1">
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

      {/* STAFF */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold">Fiche staff</h2>

        {user.staffMember ? (
          <div className="text-sm text-neutral-700 space-y-1">
            <p>
              <strong>Nom :</strong> {user.staffMember.name}
            </p>
            <p>
              <strong>Rôle :</strong> {user.staffMember.roleLabel}
            </p>
            <p>
              <strong>Section :</strong> {user.staffMember.sectionTitle}
            </p>
            <p>
              <strong>Email :</strong> {user.staffMember.email}
            </p>
            <p>
              <strong>Téléphone :</strong> {user.staffMember.phone}
            </p>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Aucune fiche staff liée</p>
        )}
      </div>

      {/* VISIBILITÉ */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">
          Visibilité des informations
        </h2>

        <ProfileVisibilityForm
          showEmailToMembers={user.showEmailToMembers}
          showPhoneToMembers={user.showPhoneToMembers}
          staffEmail={user.staffMember?.email}
          staffPhone={user.staffMember?.phone}
        />
      </div>
    </div>
  );
}
