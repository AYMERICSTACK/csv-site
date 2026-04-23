import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

async function activateUser(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      role: true,
    },
  });

  if (!currentUser || currentUser.role !== "admin") {
    redirect("/admin");
  }

  const userId = String(formData.get("userId") || "").trim();

  if (!userId) {
    throw new Error("Utilisateur manquant.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: true,
    },
  });

  revalidatePath("/admin/demandes");
}

async function deletePendingUser(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      role: true,
    },
  });

  if (!currentUser || currentUser.role !== "admin") {
    redirect("/admin");
  }

  const userId = String(formData.get("userId") || "").trim();

  if (!userId) {
    throw new Error("Utilisateur manquant.");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin/demandes");
}

export default async function AdminDemandesPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      role: true,
      name: true,
      email: true,
    },
  });

  if (!currentUser || currentUser.role !== "admin") {
    redirect("/admin");
  }

  const pendingUsers = await prisma.user.findMany({
    where: {
      isActive: false,
      role: "member",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      signupNote: true,
      createdAt: true,
      memberships: {
        select: {
          isAdmin: true,
          commission: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 px-6 py-8 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.55)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.10),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Admin</Badge>
                <Badge>Demandes d’accès</Badge>
              </div>

              <div className="mt-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={14} />
                  Retour dashboard admin
                </Link>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Demandes d’accès
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Valide les nouveaux comptes internes et vérifie les commissions
                demandées avant activation.
              </p>
            </div>

            <AdminLogoutButton />
          </div>
        </section>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-csv-orange">
                  <Users size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">
                    Comptes en attente
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Comptes créés via l’inscription interne, à activer après
                    vérification.
                  </p>
                </div>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
                  Aucune demande en attente pour le moment.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {pendingUsers.map((user) => (
                    <article
                      key={user.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div>
                            <div className="text-base font-extrabold text-neutral-900">
                              {user.name}
                            </div>

                            <div className="mt-1 flex flex-wrap gap-3 text-sm text-neutral-600">
                              <span className="inline-flex items-center gap-1">
                                <Mail size={14} />
                                {user.email}
                              </span>

                              {user.phone ? (
                                <span className="inline-flex items-center gap-1">
                                  <Phone size={14} />
                                  {user.phone}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-neutral-900">
                              Commissions demandées
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {user.memberships.length > 0 ? (
                                user.memberships.map((membership) => (
                                  <span
                                    key={membership.commission.id}
                                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700"
                                  >
                                    {membership.commission.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-neutral-500">
                                  Aucune commission liée.
                                </span>
                              )}
                            </div>
                          </div>

                          {user.signupNote ? (
                            <div>
                              <div className="text-sm font-semibold text-neutral-900">
                                Autre besoin / précision
                              </div>
                              <p className="mt-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
                                {user.signupNote}
                              </p>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <form action={activateUser}>
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                              <CheckCircle2 size={14} />
                              Activer
                            </button>
                          </form>

                          <form action={deletePendingUser}>
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              Supprimer
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
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
                  {currentUser.name || currentUser.email}
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">Rôle :</span>{" "}
                  {currentUser.role}
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">
                    Espace autorisé :
                  </span>{" "}
                  admin
                </p>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              <h2 className="text-xl font-extrabold tracking-tight">
                Validation admin
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Active uniquement les comptes vérifiés. Une fois activés, les
                utilisateurs pourront se connecter avec leur email et mot de
                passe.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">Contrôle</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Vérifie les commissions demandées avant ouverture d’accès.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">Activation</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Un clic suffit pour rendre un compte actif.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">Nettoyage</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Supprime les demandes incomplètes, erronées ou non valides.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-neutral-900">
                Raccourcis
              </h2>

              <div className="mt-4 space-y-3">
                <Link
                  href="/admin"
                  className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
                >
                  <span>Retour dashboard admin</span>
                  <ShieldCheck size={16} className="text-csv-orange" />
                </Link>

                <Link
                  href="/inscription-interne"
                  className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white"
                >
                  <span>Voir la page d’inscription interne</span>
                  <Users size={16} className="text-csv-orange" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Container>
  );
}
