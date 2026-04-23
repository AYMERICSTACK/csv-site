import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import SortableNewsList from "@/components/communication/SortableNewsList";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CalendarDays,
  LinkIcon,
  Megaphone,
  Newspaper,
  Plus,
  Radio,
  SquarePen,
  Trash2,
  Eye,
} from "lucide-react";

const FACEBOOK_PAGE_URL = "https://www.facebook.com/CSViriat.football";
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/cs_viriat/";

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getTypeLabel(type: string) {
  switch (type) {
    case "gazette":
      return "Gazette";
    case "manifestation":
      return "Manifestation";
    case "annonce":
      return "Annonce";
    default:
      return type;
  }
}

function getTypeClasses(type: string) {
  switch (type) {
    case "gazette":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "manifestation":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "annonce":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

export default async function EspaceCommunicationPage() {
  const { user } = await requireRole(["admin", "communication"]);

  async function togglePublish(formData: FormData) {
    "use server";

    await requireRole(["admin", "communication"]);

    const id = String(formData.get("id") || "").trim();

    if (!id) {
      throw new Error("ID du contenu manquant.");
    }

    const item = await prisma.newsItem.findUnique({
      where: { id },
      select: {
        id: true,
        isPublished: true,
        publishedAt: true,
      },
    });

    if (!item) {
      throw new Error("Contenu introuvable.");
    }

    const nextIsPublished = !item.isPublished;

    await prisma.newsItem.update({
      where: { id },
      data: {
        isPublished: nextIsPublished,
        publishedAt: nextIsPublished ? item.publishedAt || new Date() : null,
      },
    });

    revalidatePath("/actualites");
    revalidatePath("/espace-communication");

    redirect(
      `/espace-communication?toast=${nextIsPublished ? "published" : "draft"}`,
    );
  }

  async function deleteNewsItem(formData: FormData) {
    "use server";

    await requireRole(["admin", "communication"]);

    const id = String(formData.get("id") || "").trim();

    if (!id) {
      throw new Error("ID du contenu manquant.");
    }

    await prisma.newsItem.delete({
      where: { id },
    });

    revalidatePath("/actualites");
    revalidatePath("/espace-communication");

    redirect("/espace-communication?toast=deleted");
  }

  const role = user.role;
  const dashboardHref = role === "admin" ? "/admin" : "/espace-club";
  const dashboardLabel =
    role === "admin" ? "Retour dashboard admin" : "Retour espace club";

  const items = await prisma.newsItem.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 50,
  });

  const allItems = await prisma.newsItem.findMany({
    select: {
      id: true,
      type: true,
      isPublished: true,
    },
  });

  const totalCount = allItems.length;
  const publishedCount = allItems.filter((item) => item.isPublished).length;
  const draftCount = allItems.filter((item) => !item.isPublished).length;
  const gazetteCount = allItems.filter(
    (item) => item.type === "gazette",
  ).length;
  const manifestationCount = allItems.filter(
    (item) => item.type === "manifestation",
  ).length;
  const annonceCount = allItems.filter(
    (item) => item.type === "annonce",
  ).length;

  const sortableItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    typeLabel: getTypeLabel(item.type),
    typeClasses: getTypeClasses(item.type),
    isPublished: item.isPublished,
    excerpt: item.excerpt,
    fileUrl: item.fileUrl,
    externalUrl: item.externalUrl,
    displayDate: formatDate(item.publishedAt || item.createdAt),
  }));

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 px-6 py-8 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.55)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.24),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.12),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={dashboardHref}>
                  <Badge>Espace privé</Badge>
                </Link>

                <Link href="/espace-communication">
                  <Badge>Communication</Badge>
                </Link>

                <Link href="/actualites">
                  <Badge>Actualités</Badge>
                </Link>
              </div>

              <div className="mt-4">
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={14} />
                  {dashboardLabel}
                </Link>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Espace communication
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Centralise les gazettes, manifestations, annonces et relais
                officiels du club. Tu peux maintenant publier, masquer,
                modifier, supprimer et réorganiser les contenus directement
                depuis le dashboard.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/espace-communication/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-csv-orange px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Plus size={16} />
                  Ajouter un contenu
                </Link>

                <Link
                  href="/actualites"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Voir la page actualités
                </Link>

                <a
                  href={FACEBOOK_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Facebook
                  <LinkIcon size={15} />
                </a>

                <a
                  href={INSTAGRAM_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Instagram
                  <LinkIcon size={15} />
                </a>
              </div>
            </div>

            <AdminLogoutButton />
          </div>
        </section>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-csv-orange">
                  <Radio size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">
                    Tableau de bord communication
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Vue d’ensemble des contenus actuels publiés ou en brouillon
                    pour la page actualités du club.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                    Total contenus
                  </div>
                  <div className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900">
                    {totalCount}
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                    Publiés
                  </div>
                  <div className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900">
                    {publishedCount}
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                    Brouillons
                  </div>
                  <div className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900">
                    {draftCount}
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                    Gazettes
                  </div>
                  <div className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900">
                    {gazetteCount}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <CalendarDays size={16} className="text-blue-500" />
                    <span className="text-sm font-bold">Manifestations</span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-900">
                    {manifestationCount}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Megaphone size={16} className="text-neutral-600" />
                    <span className="text-sm font-bold">Annonces</span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-900">
                    {annonceCount}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">
                    Derniers contenus
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Aperçu rapide des dernières gazettes, manifestations et
                    annonces.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/espace-communication/new"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-csv-orange px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <Plus size={16} />
                    Ajouter
                  </Link>

                  <Link
                    href="/actualites"
                    className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                  >
                    Voir la page publique
                  </Link>
                </div>
              </div>

              {sortableItems.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-6 text-sm text-neutral-700">
                  Aucun contenu enregistré pour le moment.
                </div>
              ) : (
                <div className="mt-6">
                  <SortableNewsList
                    items={sortableItems}
                    togglePublishAction={togglePublish}
                    deleteAction={deleteNewsItem}
                  />
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
                  {user.name || user.email || "Utilisateur"}
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">Rôle :</span>{" "}
                  {user.role}
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">
                    Espace autorisé :
                  </span>{" "}
                  admin + communication
                </p>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-orange-400">
                <Newspaper size={20} />
              </div>

              <h2 className="mt-4 text-xl font-extrabold tracking-tight">
                Actions rapides
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Depuis cette page, tu peux déjà gérer les contenus sans entrer
                systématiquement dans l’écran d’édition.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <SquarePen size={16} className="text-orange-400" />
                    Modifier
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Ouvre la fiche complète du contenu pour modifier tous les
                    champs.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Eye size={16} className="text-orange-400" />
                    Publier / brouillon
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Change rapidement la visibilité publique d’une gazette, d’un
                    événement ou d’une annonce.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Trash2 size={16} className="text-orange-400" />
                    Supprimer
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Retire immédiatement un contenu du système si c’est un
                    doublon, une erreur ou un mauvais upload.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-neutral-900">
                Liens officiels
              </h2>

              <div className="mt-4 space-y-3">
                <a
                  href={FACEBOOK_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-orange-50"
                >
                  <span>Page Facebook du club</span>
                  <LinkIcon size={16} className="text-csv-orange" />
                </a>

                <a
                  href={INSTAGRAM_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-orange-50"
                >
                  <span>Compte Instagram du club</span>
                  <LinkIcon size={16} className="text-csv-orange" />
                </a>

                <Link
                  href="/actualites"
                  className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                >
                  <span>Voir la page publique actualités</span>
                  <LinkIcon size={16} className="text-csv-orange" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Container>
  );
}
