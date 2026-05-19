import type { ComponentType } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { prisma } from "@/lib/prisma";
import { isUserRole, type UserRole } from "@/lib/roles";
import {
  ArrowRight,
  Beer,
  Calendar,
  ClipboardList,
  Eye,
  Handshake,
  IdCard,
  LayoutDashboard,
  Megaphone,
  PartyPopper,
  ShieldCheck,
  Trophy,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";

type ClubSection = "sportif" | "commissions" | "administration" | "personnel";

type ClubCard = {
  title: string;
  description: string;
  href: string;
  roles: UserRole[];
  badge: string;
  section: ClubSection;
  priority?: boolean;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const CLUB_CARDS: ClubCard[] = [
  {
    title: "Gestion des équipes",
    description:
      "Piloter les effectifs, les fiches équipes, les statistiques et les liens FFF.",
    href: "/admin/equipes",
    roles: ["admin", "educateurs"],
    badge: "Sportif",
    section: "sportif",
    priority: true,
    icon: Users,
  },
  {
    title: "Gestion des matchs",
    description:
      "Ajouter, modifier et suivre les rencontres du calendrier sportif.",
    href: "/admin/matchs",
    roles: ["admin", "educateurs"],
    badge: "Sportif",
    section: "sportif",
    priority: true,
    icon: Calendar,
  },
  {
    title: "Classements publics",
    description:
      "Consulter les classements buteurs, passeurs et les liens officiels FFF.",
    href: "/classements",
    roles: ["admin", "educateurs"],
    badge: "Public",
    section: "sportif",
    icon: Trophy,
  },
  {
    title: "Sponsoring",
    description:
      "Gérer les partenaires, les logos, les liens et leur visibilité sur le site.",
    href: "/espace-sponsoring",
    roles: ["admin", "sponsoring"],
    badge: "Commission",
    section: "commissions",
    priority: true,
    icon: Handshake,
  },
  {
    title: "Communication",
    description:
      "Préparer les contenus, visuels, publications et informations du club.",
    href: "/espace-communication",
    roles: ["admin", "communication"],
    badge: "Commission",
    section: "commissions",
    icon: Megaphone,
  },
  {
    title: "Licence",
    description:
      "Suivre les licences, dossiers joueurs et démarches administratives.",
    href: "/espace-licence",
    roles: ["admin", "licence"],
    badge: "Commission",
    section: "commissions",
    icon: IdCard,
  },
  {
    title: "Bureau",
    description:
      "Coordonner l’organisation générale, les décisions et le pilotage du club.",
    href: "/espace-bureau",
    roles: ["admin", "bureau"],
    badge: "Commission",
    section: "commissions",
    icon: ClipboardList,
  },

  {
    title: "Staff & organigramme",
    description:
      "Gérer les membres du bureau, référents et responsables du club.",
    href: "/admin/staff",
    roles: ["admin", "bureau"],
    badge: "Organisation",
    section: "commissions",
    icon: Users,
  },

  {
    title: "Matériel",
    description:
      "Suivre les équipements, besoins terrain et ressources matérielles.",
    href: "/espace-materiel",
    roles: ["admin", "materiel"],
    badge: "Commission",
    section: "commissions",
    icon: Wrench,
  },
  {
    title: "Festivité",
    description:
      "Organiser les événements, repas, animations et temps forts du club.",
    href: "/espace-festivite",
    roles: ["admin", "festivite"],
    badge: "Commission",
    section: "commissions",
    icon: PartyPopper,
  },
  {
    title: "Buvette",
    description:
      "Organiser la buvette, les permanences et la logistique des jours de match.",
    href: "/espace-buvette",
    roles: ["admin", "buvette"],
    badge: "Commission",
    section: "commissions",
    icon: Beer,
  },

  {
    title: "Commissions",
    description: "Voir les commissions, les membres affichés et les accès.",
    href: "/espace-club/commissions",
    roles: [
      "admin",
      "bureau",
      "sponsoring",
      "communication",
      "materiel",
      "festivite",
      "educateurs",
      "buvette",
      "licence",
    ],
    badge: "Organisation",
    section: "commissions",
    icon: ShieldCheck,
  },

  {
    title: "Administration générale",
    description:
      "Accéder au tableau de bord administrateur et aux réglages sensibles.",
    href: "/admin",
    roles: ["admin"],
    badge: "Admin",
    section: "administration",
    priority: true,
    icon: ShieldCheck,
  },
  {
    title: "Voir le site public",
    description:
      "Contrôler rapidement le rendu visible par les visiteurs du site.",
    href: "/",
    roles: [
      "admin",
      "communication",
      "bureau",
      "materiel",
      "sponsoring",
      "festivite",
      "educateurs",
      "buvette",
      "member",
      "licence",
    ],
    badge: "Public",
    section: "personnel",
    icon: Eye,
  },
  {
    title: "Mon profil",
    description:
      "Gérer vos informations personnelles et vos préférences de visibilité.",
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
      "member",
      "licence",
    ],
    badge: "Profil",
    section: "personnel",
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
  licence: "Commission licence",
};

const SECTION_LABELS: Record<
  ClubSection,
  { title: string; description: string }
> = {
  sportif: {
    title: "Sportif",
    description:
      "Les outils pour les éducateurs, équipes, matchs et classements.",
  },
  commissions: {
    title: "Commissions",
    description: "Les espaces dédiés aux responsables de commissions du club.",
  },
  administration: {
    title: "Administration",
    description: "Les accès sensibles réservés aux administrateurs du site.",
  },
  personnel: {
    title: "Accès rapides",
    description: "Les raccourcis utiles pour votre compte et le site public.",
  },
};

const SECTION_ORDER: ClubSection[] = [
  "sportif",
  "commissions",
  "administration",
  "personnel",
];

function getWelcomeText(roles: UserRole[]) {
  if (roles.includes("admin")) {
    return "Pilotez les espaces du club depuis un hub clair, structuré et pensé pour aller vite.";
  }

  if (roles.includes("educateurs")) {
    return "Retrouvez vos outils sportifs : équipes, matchs, effectifs, statistiques et classements.";
  }

  if (roles.some((role) => role !== "member")) {
    return "Accédez directement à vos commissions et aux outils utiles pour faire avancer le club.";
  }

  return "Bienvenue dans votre espace privé CS Viriat.";
}

export default async function EspaceClubPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: {
          commission: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/admin/login");
  }

  if (!isUserRole(user.role)) {
    redirect("/admin/login");
  }

  const membershipRoles = user.memberships
    .map((membership) => membership.commission.slug)
    .filter(isUserRole);

  const availableRoles = Array.from(
    new Set<UserRole>([user.role, ...membershipRoles]),
  );

  const visibleCards = CLUB_CARDS.filter((card) =>
    card.roles.some((role) => availableRoles.includes(role)),
  );

  const priorityCards = visibleCards
    .filter((card) => card.priority)
    .slice(0, 4);

  const priorityCardHrefs = new Set(priorityCards.map((card) => card.href));

  const sectionCards = visibleCards.filter(
    (card) => !priorityCardHrefs.has(card.href),
  );

  const groupedCards = SECTION_ORDER.map((section) => ({
    section,
    ...SECTION_LABELS[section],
    cards: sectionCards.filter((card) => card.section === section),
  })).filter((group) => group.cards.length > 0);

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 px-6 py-8 shadow-sm md:px-8 md:py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
          <div className="absolute -right-16 top-0 h-52 w-52 rounded-full bg-csv-orange/25 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Espace club</Badge>
                <Badge>{ROLE_LABELS[user.role]}</Badge>

                {membershipRoles.map((role) => (
                  <Badge key={role}>{ROLE_LABELS[role]}</Badge>
                ))}
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Bonjour {user.name || "CS Viriat"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                {getWelcomeText(availableRoles)} Les accès affichés sont adaptés
                à votre rôle pour éviter de chercher au mauvais endroit.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              {availableRoles.includes("admin") ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-neutral-950 transition hover:bg-csv-orange hover:text-white"
                >
                  <LayoutDashboard size={16} />
                  Dashboard admin
                </Link>
              ) : null}

              <AdminLogoutButton />
            </div>
          </div>
        </section>

        {priorityCards.length > 0 ? (
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {priorityCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-csv-orange hover:shadow-xl"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white transition group-hover:bg-csv-orange">
                      <Icon size={20} />
                    </div>

                    <ArrowRight
                      size={18}
                      className="text-neutral-300 transition group-hover:translate-x-1 group-hover:text-csv-orange"
                    />
                  </div>

                  <h2 className="mt-5 text-lg font-extrabold tracking-tight text-neutral-950">
                    {card.title}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </section>
        ) : null}

        <div className="mt-10 space-y-10">
          {groupedCards.map((group) => (
            <section key={group.section}>
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-neutral-950">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {group.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {group.cards.map((card) => {
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
                          <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-600">
                            {card.badge}
                          </span>

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
          ))}
        </div>

        {visibleCards.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
            Aucun accès spécifique n’est encore disponible pour ce compte.
          </div>
        ) : null}
      </div>
    </Container>
  );
}
