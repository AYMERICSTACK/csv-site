import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AddCommissionUserForm from "@/components/AddCommissionUserForm";
import EditCommissionForm from "@/components/EditCommissionForm";
import SetCommissionUserAdminButton from "@/components/SetCommissionUserAdminButton";
import RemoveCommissionUserButton from "@/components/RemoveCommissionUserButton";
import EditCommissionUserMembershipForm from "@/components/EditCommissionUserMembershipForm";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CommissionDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        select: {
          commissionId: true,
          isAdmin: true,
        },
      },
    },
  });

  if (!user) {
    return <div className="p-6">Utilisateur introuvable</div>;
  }

  const commission = await prisma.commission.findUnique({
    where: { slug },
    include: {
      memberships: {
        orderBy: [{ isAdmin: "desc" }, { user: { name: "asc" } }],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              showEmailToMembers: true,
              showPhoneToMembers: true,
            },
          },
        },
      },
    },
  });

  if (!commission || !commission.isPublished) {
    notFound();
  }

  const isGlobalAdmin = user.role === "admin";

  const currentMembership = user.memberships.find(
    (membership) => membership.commissionId === commission.id,
  );

  const isCommissionMember = Boolean(currentMembership);
  const isCommissionAdmin = currentMembership?.isAdmin === true;
  const canManageCommission = isGlobalAdmin || isCommissionAdmin;

  const availableUsers = canManageCommission
    ? await prisma.user.findMany({
        where: {
          isActive: true,
          memberships: {
            none: {
              commissionId: commission.id,
            },
          },
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
    : [];

  const commissionMemberships = commission.memberships;
  const visibleMemberships = commissionMemberships.filter(
    (membership) => membership.isVisibleInCommission,
  );

  return (
    <Container>
      <div className="space-y-8 py-10">
        <section className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%),linear-gradient(135deg,#111_0%,#000_100%)] px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Admin</Badge>
                <Badge>Commissions</Badge>
                <Badge>{commission.name}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/espace-club/commissions"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  ← Retour aux commissions
                </Link>

                <Link
                  href="/admin"
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  Dashboard admin
                </Link>
              </div>

              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                {commission.name}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-lg">
                {commission.description ||
                  "Gère les informations de la commission, les accès utilisateurs et les membres affichés sur l’espace club."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {isGlobalAdmin ? (
                  <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">
                    Admin global
                  </span>
                ) : null}

                {!isGlobalAdmin && isCommissionMember ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    Membre de la commission
                  </span>
                ) : null}

                {isCommissionAdmin ? (
                  <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-100">
                    Admin de la commission
                  </span>
                ) : null}

                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {visibleMemberships.length} membre
                  {visibleMemberships.length > 1 ? "s" : ""}
                </span>

                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {commissionMemberships.length} accès utilisateur
                  {commissionMemberships.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <AdminLogoutButton />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-1">
            <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              Vue d’ensemble
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
              Informations
            </h2>

            <div className="mt-5 space-y-3 text-sm text-neutral-700">
              {commission.showEmail && commission.email ? (
                <p>
                  <strong>Email :</strong> {commission.email}
                </p>
              ) : (
                <p>
                  <strong>Email :</strong>{" "}
                  <span className="text-neutral-400">
                    Masqué ou non renseigné
                  </span>
                </p>
              )}

              {commission.showPhone && commission.phone ? (
                <p>
                  <strong>Téléphone :</strong> {commission.phone}
                </p>
              ) : (
                <p>
                  <strong>Téléphone :</strong>{" "}
                  <span className="text-neutral-400">
                    Masqué ou non renseigné
                  </span>
                </p>
              )}

              <p>
                <strong>Membres affichés :</strong> {visibleMemberships.length}
              </p>

              <p>
                <strong>Utilisateurs avec accès :</strong>{" "}
                {commissionMemberships.length}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {commission.showEmail && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                  Email visible
                </span>
              )}

              {commission.showPhone && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                  Téléphone visible
                </span>
              )}

              {commission.showMembers && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                  Membres visibles
                </span>
              )}
            </div>
          </div>

          {canManageCommission ? (
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                Administration
              </div>
              <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
                Paramètres de la commission
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Modifie les informations de la commission et choisis ce qui est
                visible pour les autres.
              </p>

              <div className="mt-6">
                <EditCommissionForm
                  slug={commission.slug}
                  initialName={commission.name}
                  initialDescription={commission.description}
                  initialEmail={commission.email}
                  initialPhone={commission.phone}
                  initialShowMembers={commission.showMembers}
                  initialShowEmail={commission.showEmail}
                  initialShowPhone={commission.showPhone}
                />
              </div>
            </div>
          ) : null}
        </section>

        {canManageCommission ? (
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                  Accès
                </div>
                <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
                  Utilisateurs ayant accès à la commission
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  Gère les utilisateurs qui peuvent se connecter et administrer
                  cette commission.
                </p>
              </div>

              <div className="w-full max-w-md">
                <AddCommissionUserForm
                  slug={commission.slug}
                  availableUsers={availableUsers}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {commissionMemberships.length > 0 ? (
                commissionMemberships.map((membership) => (
                  <div
                    key={membership.user.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {membership.user.name}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {membership.user.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {membership.user.role === "admin" ? (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                            Admin global
                          </span>
                        ) : null}

                        {membership.isAdmin ? (
                          <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                            Admin commission
                          </span>
                        ) : (
                          <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-600">
                            Accès simple
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <SetCommissionUserAdminButton
                        slug={commission.slug}
                        userId={membership.user.id}
                        userName={membership.user.name}
                        isCurrentAdmin={membership.isAdmin}
                      />

                      <RemoveCommissionUserButton
                        slug={commission.slug}
                        userId={membership.user.id}
                        userName={membership.user.name}
                      />
                    </div>

                    {canManageCommission ? (
                      <EditCommissionUserMembershipForm
                        slug={commission.slug}
                        userId={membership.user.id}
                        initialRoleLabel={membership.roleLabel}
                        initialIsVisibleInCommission={
                          membership.isVisibleInCommission
                        }
                      />
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">
                  Aucun utilisateur n’a encore accès à cette commission.
                </p>
              )}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="max-w-2xl">
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                Affichage
              </div>
              <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
                Membres de la commission
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Les membres affichés ici proviennent directement des
                utilisateurs ayant accès à cette commission, selon leurs
                préférences de visibilité.
              </p>
            </div>
          </div>

          {commission.showMembers ? (
            visibleMemberships.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {visibleMemberships.map((membership) => {
                  const canShowEmail =
                    commission.showEmail && membership.user.showEmailToMembers;

                  const canShowPhone =
                    commission.showPhone && membership.user.showPhoneToMembers;

                  return (
                    <div
                      key={membership.user.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-neutral-900">
                            {membership.user.name}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {membership.user.role === "admin" ? (
                              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                                Admin global
                              </span>
                            ) : null}

                            {membership.isAdmin ? (
                              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                                Admin commission
                              </span>
                            ) : null}

                            {membership.roleLabel ? (
                              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-600">
                                {membership.roleLabel}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-neutral-700">
                        <p>
                          <strong>Email :</strong>{" "}
                          {canShowEmail ? membership.user.email : "Masqué"}
                        </p>

                        <p>
                          <strong>Téléphone :</strong>{" "}
                          {canShowPhone
                            ? membership.user.phone || "—"
                            : "Masqué"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 text-sm text-neutral-500">
                Aucun membre visible dans cette commission.
              </p>
            )
          ) : (
            <p className="mt-6 text-sm text-neutral-500">
              L’affichage des membres est actuellement désactivé pour cette
              commission.
            </p>
          )}
        </section>
      </div>
    </Container>
  );
}
