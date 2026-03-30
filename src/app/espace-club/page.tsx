import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { isUserRole, type UserRole } from "@/lib/roles";

type ClubCard = {
  title: string;
  description: string;
  href: string;
  roles: UserRole[];
  badge: string;
};

const CLUB_CARDS: ClubCard[] = [
  {
    title: "Gestion des matchs",
    description:
      "Ajouter, modifier et supprimer les rencontres du calendrier du club.",
    href: "/admin/matchs",
    roles: ["admin", "educateurs"],
    badge: "Administration",
  },
  {
    title: "Communication",
    description:
      "Organiser les contenus, visuels, publications et supports de communication du club.",
    href: "/espace-communication",
    roles: ["admin", "communication"],
    badge: "Commission",
  },
  {
    title: "Bureau",
    description:
      "Coordonner les sujets transverses, l'organisation générale et le pilotage du club.",
    href: "/espace-bureau",
    roles: ["admin", "bureau"],
    badge: "Commission",
  },
  {
    title: "Matériel",
    description:
      "Structurer le suivi des équipements, des besoins matériels et des ressources du club.",
    href: "/espace-materiel",
    roles: ["admin", "materiel"],
    badge: "Commission",
  },
  {
    title: "Festivité",
    description:
      "Préparer les événements, animations et temps forts de la vie du club.",
    href: "/espace-festivite",
    roles: ["admin", "festivite"],
    badge: "Commission",
  },
  {
    title: "Éducateurs",
    description:
      "Centraliser les informations, ressources et éléments utiles aux éducateurs.",
    href: "/espace-educateurs",
    roles: ["admin", "educateurs"],
    badge: "Commission",
  },
  {
    title: "Buvette",
    description:
      "Préparer l’organisation, la logistique et les besoins liés à la buvette.",
    href: "/espace-buvette",
    roles: ["admin", "buvette"],
    badge: "Commission",
  },
  {
    title: "Sponsoring",
    description:
      "Gérer les partenaires, leur visibilité, leurs logos et leur mise en avant sur le site.",
    href: "/espace-sponsoring",
    roles: ["admin", "sponsoring"],
    badge: "Commission",
  },
  {
    title: "Mon profil",
    description:
      "Consulter tes informations personnelles, ton rôle et tes préférences de visibilité.",
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
    badge: "Utilisateur",
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
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Espace club</Badge>
              <Badge>{ROLE_LABELS[role]}</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Bienvenue dans votre espace privé
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Retrouvez ici les accès utiles selon votre rôle au sein du CS
              Viriat.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                {card.badge}
              </div>

              <h2 className="mt-3 text-xl font-extrabold text-neutral-900">
                {card.title}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                {card.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </Container>
  );
}
