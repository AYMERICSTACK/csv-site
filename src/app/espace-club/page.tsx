import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { isUserRole, type UserRole } from "@/lib/roles";
import {
  Calendar,
  Megaphone,
  Users,
  Wrench,
  PartyPopper,
  Beer,
  Handshake,
  UserCircle,
  ArrowRight,
} from "lucide-react";

type ClubCard = {
  title: string;
  description: string;
  href: string;
  roles: UserRole[];
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const CLUB_CARDS: ClubCard[] = [
  {
    title: "Gestion des matchs",
    description:
      "Ajouter, modifier et supprimer les rencontres du calendrier du club.",
    href: "/admin/matchs",
    roles: ["admin", "educateurs"],
    badge: "Administration",
    icon: Calendar,
  },
  {
    title: "Communication",
    description: "Organiser les contenus, visuels et publications du club.",
    href: "/espace-communication",
    roles: ["admin", "communication"],
    badge: "Commission",
    icon: Megaphone,
  },
  {
    title: "Bureau",
    description: "Coordonner l’organisation générale et le pilotage du club.",
    href: "/espace-bureau",
    roles: ["admin", "bureau"],
    badge: "Commission",
    icon: Users,
  },
  {
    title: "Matériel",
    description: "Suivi des équipements et gestion des ressources matérielles.",
    href: "/espace-materiel",
    roles: ["admin", "materiel"],
    badge: "Commission",
    icon: Wrench,
  },
  {
    title: "Festivité",
    description: "Organisation des événements et animations du club.",
    href: "/espace-festivite",
    roles: ["admin", "festivite"],
    badge: "Commission",
    icon: PartyPopper,
  },
  {
    title: "Éducateurs",
    description: "Accès aux outils et à la gestion sportive des équipes.",
    href: "/espace-educateurs",
    roles: ["admin", "educateurs"],
    badge: "Commission",
    icon: Users,
  },
  {
    title: "Buvette",
    description: "Organisation logistique et gestion de la buvette.",
    href: "/espace-buvette",
    roles: ["admin", "buvette"],
    badge: "Commission",
    icon: Beer,
  },
  {
    title: "Sponsoring",
    description: "Gestion des partenaires et de leur visibilité.",
    href: "/espace-sponsoring",
    roles: ["admin", "sponsoring"],
    badge: "Commission",
    icon: Handshake,
  },
  {
    title: "Compte commission",
    description:
      "Informations du compte connecté et membres liés à la commission.",
    href: "/espace-club/profil",
    roles: [
      "admin",
      "communication",
      "bureau",
      "materiel",
      "sponsoring",
      "festivite",
      "educateurs",
      "buvette",
    ],
    badge: "Compte",
    icon: UserCircle,
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  communication: "Commission communication",
  bureau: "Commission bureau",
  materiel: "Commission matériel",
  sponsoring: "Commission sponsoring",
  festivite: "Commission festivité",
  educateurs: "Commission éducateurs",
  buvette: "Commission buvette",
  member: "Membre",
};

export default async function EspaceClubPage() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.user?.role;

  if (role === "admin") {
    redirect("/admin");
  }

  if (!role || !isUserRole(role)) {
    redirect("/admin/login");
  }

  const visibleCards = CLUB_CARDS.filter((card) =>
    card.roles.includes(role as UserRole),
  );

  return (
    <Container>
      <div className="py-14">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 px-6 py-8 shadow-sm md:px-8 md:py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
          <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-csv-orange/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Espace club</Badge>
                <Badge>{ROLE_LABELS[role]}</Badge>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Votre espace privé CS Viriat
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Accédez rapidement aux outils, espaces et ressources utiles
                selon votre commission. Une interface claire, centralisée et
                pensée pour un usage quotidien.
              </p>
            </div>

            <div className="shrink-0">
              <AdminLogoutButton />
            </div>
          </div>
        </section>

        {/* CARDS */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">
                Accès disponibles
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Ouvrez les espaces correspondant à votre rôle et à vos besoins.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-orange-50/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-csv-orange/10 blur-2xl transition group-hover:bg-csv-orange/20" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-600">
                          {card.badge}
                        </div>
                      </div>

                      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-700 transition-all duration-200 group-hover:border-csv-orange group-hover:bg-csv-orange group-hover:text-white group-hover:shadow-md">
                        <Icon size={20} />
                      </div>
                    </div>

                    <h3 className="mt-5 text-xl font-extrabold tracking-tight text-neutral-900">
                      {card.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                      {card.description}
                    </p>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900">
                        Ouvrir
                      </span>

                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-all duration-200 group-hover:border-csv-orange group-hover:text-csv-orange">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </Container>
  );
}
