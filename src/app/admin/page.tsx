import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  Handshake,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Trophy,
  UserCog,
  Users,
  Wrench,
  Wine,
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { getHomePathByRole } from "@/lib/roles";

type DashboardCard = {
  title: string;
  description: string;
  href: string;
  eyebrow: string;
  icon: typeof LayoutDashboard;
  featured?: boolean;
  external?: boolean;
  tone?: "manage" | "info";
};

const priorityCards: DashboardCard[] = [
  {
    title: "Gestion des équipes",
    description:
      "Effectifs, matchs, statistiques joueurs et liens FFF par équipe.",
    href: "/admin/equipes",
    eyebrow: "Sportif",
    icon: Trophy,
    featured: true,
    tone: "manage",
  },
  {
    title: "Gestion des matchs",
    description: "Ajouter, modifier et suivre les rencontres du club.",
    href: "/admin/matchs",
    eyebrow: "Calendrier",
    icon: CalendarDays,
    featured: true,
    tone: "manage",
  },
  {
    title: "Partenaires",
    description: "Mettre à jour les sponsors, logos et visibilités du site.",
    href: "/espace-sponsoring",
    eyebrow: "Sponsoring",
    icon: Handshake,
    featured: true,
    tone: "manage",
  },
  {
    title: "Voir le site public",
    description: "Contrôler rapidement ce que voient les visiteurs du site.",
    href: "/",
    eyebrow: "Public",
    icon: ExternalLink,
    featured: true,
    external: true,
  },
];

const administrationCards: DashboardCard[] = [
  {
    title: "Demandes d’accès",
    description: "Valider les inscriptions internes et activer les comptes.",
    href: "/admin/demandes",
    eyebrow: "Accès",
    icon: ClipboardCheck,
    tone: "manage",
  },
  {
    title: "Commissions",
    description: "Gérer les commissions, les membres affichés et les accès.",
    href: "/espace-club/commissions",
    eyebrow: "Organisation",
    icon: ShieldCheck,
    tone: "manage",
  },
  {
    title: "Staff & organigramme",
    description:
      "Gérer les membres du bureau, référents et responsables du club.",
    href: "/admin/staff",
    eyebrow: "Organisation",
    icon: Users,
    tone: "manage",
  },
  {
    title: "Mon profil",
    description: "Consulter et modifier tes informations personnelles.",
    href: "/espace-club/profil",
    eyebrow: "Utilisateur",
    icon: UserCog,
    tone: "info",
  },
];

const commissionCards: DashboardCard[] = [
  {
    title: "Sponsoring",
    description: "Gérer les partenaires et leur visibilité sur le site.",
    href: "/espace-sponsoring",
    eyebrow: "Partenaires",
    icon: Handshake,
    tone: "manage",
  },
  {
    title: "Communication",
    description: "Organiser les contenus, visuels et publications du club.",
    href: "/espace-communication",
    eyebrow: "Contenus",
    icon: Megaphone,
    tone: "manage",
  },
  {
    title: "Bureau",
    description: "Coordonner les sujets transverses et le pilotage du club.",
    href: "/espace-bureau",
    eyebrow: "Pilotage",
    icon: LayoutDashboard,
    tone: "manage",
  },
  {
    title: "Matériel",
    description: "Structurer les équipements et le suivi du matériel.",
    href: "/espace-materiel",
    eyebrow: "Logistique",
    icon: Wrench,
    tone: "manage",
  },
  {
    title: "Festivité",
    description: "Préparer les événements et animations du club.",
    href: "/espace-festivite",
    eyebrow: "Événements",
    icon: Wine,
    tone: "manage",
  },
  {
    title: "Éducateurs",
    description: "Centraliser les informations utiles aux éducateurs.",
    href: "/espace-educateurs",
    eyebrow: "Sportif",
    icon: Users,
    tone: "manage",
  },
  {
    title: "Buvette",
    description: "Préparer l’organisation et les besoins de la buvette.",
    href: "/espace-buvette",
    eyebrow: "Match day",
    icon: Wine,
    tone: "manage",
  },
  {
    title: "Licence",
    description:
      "Suivre les licences, dossiers joueurs et démarches administratives.",
    href: "/espace-licence",
    eyebrow: "Dossiers",
    icon: ClipboardCheck,
    tone: "manage",
  },
];

const sportCards: DashboardCard[] = [
  {
    title: "Gestion des équipes",
    description:
      "Gérer les effectifs, les groupes, les stats et les liens FFF.",
    href: "/admin/equipes",
    eyebrow: "Équipes",
    icon: Trophy,
    tone: "manage",
  },
  {
    title: "Matchs",
    description: "Créer, modifier et publier les rencontres du club.",
    href: "/admin/matchs",
    eyebrow: "Rencontres",
    icon: CalendarDays,
    tone: "manage",
  },
  {
    title: "Classements publics",
    description: "Vérifier les classements joueurs et les accès FFF publics.",
    href: "/classements",
    eyebrow: "Public",
    icon: ExternalLink,
    external: true,
  },
];

function DashboardCardItem({ card }: { card: DashboardCard }) {
  const Icon = card.icon;

  const isManageCard = card.tone === "manage";

  return (
    <Link
      href={card.href}
      target={card.external ? "_blank" : undefined}
      rel={card.external ? "noreferrer" : undefined}
      className={
        card.featured
          ? "group flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_80px_-45px_rgba(0,0,0,0.75)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-2xl"
          : `group flex h-full flex-col justify-between rounded-[2rem] border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              isManageCard
                ? "border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:border-orange-300"
                : "border-neutral-200 bg-white hover:border-neutral-300"
            }`
      }
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <span
            className={
              card.featured
                ? "inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-200"
                : isManageCard
                  ? "inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700"
                  : "inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-700"
            }
          >
            {card.eyebrow}
          </span>

          <div
            className={
              card.featured
                ? "rounded-2xl bg-white/10 p-3 text-orange-200 transition group-hover:bg-orange-500 group-hover:text-white"
                : isManageCard
                  ? "rounded-2xl bg-orange-100 p-3 text-orange-700 transition group-hover:bg-orange-500 group-hover:text-white"
                  : "rounded-2xl bg-neutral-950 p-3 text-white transition group-hover:bg-neutral-800"
            }
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <h3
          className={
            card.featured
              ? "mt-5 text-2xl font-black tracking-tight text-white"
              : "mt-5 text-xl font-black tracking-tight text-neutral-950"
          }
        >
          {card.title}
        </h3>

        <p
          className={
            card.featured
              ? "mt-3 text-sm leading-relaxed text-neutral-300"
              : "mt-3 text-sm leading-relaxed text-neutral-600"
          }
        >
          {card.description}
        </p>
      </div>

      <div
        className={
          card.featured
            ? "mt-6 text-sm font-bold text-orange-200"
            : isManageCard
              ? "mt-6 text-sm font-bold text-orange-600"
              : "mt-6 text-sm font-bold text-neutral-600"
        }
      >
        {isManageCard ? "Gérer →" : "Ouvrir →"}
      </div>
    </Link>
  );
}

function DashboardSection({
  title,
  description,
  cards,
}: {
  title: string;
  description: string;
  cards: DashboardCard[];
}) {
  return (
    <section className="rounded-[2rem] border border-neutral-200 bg-white/80 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-neutral-950">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <DashboardCardItem key={`${card.title}-${card.href}`} card={card} />
        ))}
      </div>
    </section>
  );
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.user?.role;

  if (role !== "admin") {
    redirect(getHomePathByRole(role));
  }

  const userName = session.user?.name || session.user?.email || "Admin";

  return (
    <Container>
      <div className="py-14">
        <section className="overflow-hidden rounded-[2.25rem] bg-neutral-950 px-6 py-8 text-white shadow-[0_30px_100px_-50px_rgba(0,0,0,0.85)] md:px-10 md:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Admin</Badge>
                <Badge>Hub central</Badge>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
                Tableau de bord du club
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-300 md:text-lg">
                Bonjour {userName}. Retrouve ici les accès importants du CS
                Viriat, classés par usage pour guider chaque responsable au bon
                endroit.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-neutral-950 transition hover:bg-orange-100"
              >
                Voir le site public
                <ExternalLink className="h-4 w-4" />
              </Link>

              <AdminLogoutButton />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {priorityCards.map((card) => (
            <DashboardCardItem key={`${card.title}-${card.href}`} card={card} />
          ))}
        </section>

        <div className="mt-10 space-y-8">
          <DashboardSection
            title="Administration"
            description="Les accès sensibles pour gérer les comptes, les permissions et l’organisation interne."
            cards={administrationCards}
          />

          <DashboardSection
            title="Sportif"
            description="Les outils terrain pour les équipes, les matchs, les effectifs et les classements."
            cards={sportCards}
          />

          <DashboardSection
            title="Commissions"
            description="Chaque commission retrouve son espace dédié pour travailler sans chercher dans tout le site."
            cards={commissionCards}
          />
        </div>
      </div>
    </Container>
  );
}
