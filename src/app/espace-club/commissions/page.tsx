import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import Container from "@/components/Container";

export default async function CommissionsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return <div className="p-6">Utilisateur introuvable</div>;
  }

  const commissions = await prisma.commission.findMany({
    where: {
      isPublished: true,
    },
    include: {
      members: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <Container>
      <div className="py-10 space-y-8">
        <section className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%),linear-gradient(135deg,#111_0%,#000_100%)] px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Admin</Badge>
                <Badge>Commissions</Badge>
              </div>

              <div className="mt-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  ← Retour admin
                </Link>
              </div>

              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Gestion des commissions
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-lg">
                Consulte les commissions du club, leurs informations, leurs
                membres affichés et leurs accès utilisateurs.
              </p>
            </div>

            <div className="shrink-0">
              <AdminLogoutButton />
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {commissions.map((commission) => (
            <Link
              key={commission.id}
              href={`/espace-club/commissions/${commission.slug}`}
              className="group rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                    Commission
                  </div>
                  <h2 className="mt-3 text-xl font-extrabold text-neutral-900 transition group-hover:text-orange-600">
                    {commission.name}
                  </h2>
                </div>

                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {commission.members.length} membre
                  {commission.members.length > 1 ? "s" : ""}
                </span>
              </div>

              {commission.description && (
                <p className="mt-4 text-sm leading-relaxed text-neutral-700">
                  {commission.description}
                </p>
              )}

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

              <div className="mt-6 inline-flex items-center text-sm font-semibold text-orange-600">
                Ouvrir la commission →
              </div>
            </Link>
          ))}
        </section>
      </div>
    </Container>
  );
}
