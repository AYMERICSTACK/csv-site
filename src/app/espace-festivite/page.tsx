import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import DeleteNewsItemButton from "@/components/DeleteNewsItemButton";
import FormSubmitButton from "@/components/ui/FormSubmitButton";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  MapPin,
  PartyPopper,
  Plus,
  SquarePen,
} from "lucide-react";

function formatEventDate(date: Date | string | null | undefined) {
  if (!date) return "Date à préciser";

  return new Date(date).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toastMessage(toast?: string) {
  switch (toast) {
    case "created":
      return "Manifestation créée avec succès.";
    case "updated":
      return "Manifestation mise à jour.";
    case "deleted":
      return "Manifestation supprimée.";
    case "published":
      return "Manifestation publiée.";
    case "draft":
      return "Manifestation repassée en brouillon.";
    default:
      return null;
  }
}

export default async function EspaceFestivitePage({
  searchParams,
}: {
  searchParams?: Promise<{ toast?: string }>;
}) {
  const { user } = await requireRole(["admin", "festivite"]);
  const resolvedSearchParams = await searchParams;
  const message = toastMessage(resolvedSearchParams?.toast);

  async function togglePublish(formData: FormData) {
    "use server";

    await requireRole(["admin", "festivite"]);

    const id = String(formData.get("id") || "").trim();

    if (!id) {
      throw new Error("ID de la manifestation manquant.");
    }

    const item = await prisma.newsItem.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        isPublished: true,
        publishedAt: true,
      },
    });

    if (!item || item.type !== "manifestation") {
      throw new Error("Manifestation introuvable.");
    }

    const nextIsPublished = !item.isPublished;

    await prisma.newsItem.update({
      where: { id },
      data: {
        isPublished: nextIsPublished,
        publishedAt: nextIsPublished ? item.publishedAt || new Date() : null,
      },
    });

    revalidatePath("/");
    revalidatePath("/actualites");
    revalidatePath("/espace-communication");
    revalidatePath("/espace-festivite");

    redirect(`/espace-festivite?toast=${nextIsPublished ? "published" : "draft"}`);
  }

  async function deleteManifestation(formData: FormData) {
    "use server";

    await requireRole(["admin", "festivite"]);

    const id = String(formData.get("id") || "").trim();

    if (!id) {
      throw new Error("ID de la manifestation manquant.");
    }

    const item = await prisma.newsItem.findUnique({
      where: { id },
      select: { type: true },
    });

    if (!item || item.type !== "manifestation") {
      throw new Error("Manifestation introuvable.");
    }

    await prisma.newsItem.delete({ where: { id } });

    revalidatePath("/");
    revalidatePath("/actualites");
    revalidatePath("/espace-communication");
    revalidatePath("/espace-festivite");

    redirect("/espace-festivite?toast=deleted");
  }

  const role = user.role;
  const dashboardHref = role === "admin" ? "/admin" : "/espace-club";
  const dashboardLabel =
    role === "admin" ? "Retour dashboard admin" : "Retour espace club";

  const manifestations = await prisma.newsItem.findMany({
    where: { type: "manifestation" },
    orderBy: [{ eventDate: "asc" }, { createdAt: "desc" }],
  });

  const now = new Date();
  const upcomingCount = manifestations.filter(
    (item) => item.eventDate && item.eventDate >= now,
  ).length;
  const publishedCount = manifestations.filter((item) => item.isPublished).length;
  const draftCount = manifestations.length - publishedCount;

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 px-6 py-8 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.55)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.10),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-csv-orange/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={dashboardHref}>
                  <Badge>Espace privé</Badge>
                </Link>
                <Link href="/espace-festivite">
                  <Badge>Festivité</Badge>
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
                Manifestations du club
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Ajoute et mets à jour les dates des manifestations directement
                depuis l’espace Festivité. Les événements publiés alimentent la
                page Actualités et la prochaine manifestation de l’accueil.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <AdminLogoutButton />
              <Link
                href="/espace-communication/new?type=manifestation&from=festivite"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Ajouter une manifestation
              </Link>
            </div>
          </div>
        </section>

        {message ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-800">
            <CheckCircle2 size={18} />
            {message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="text-3xl font-extrabold text-neutral-950">
              {manifestations.length}
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-600">
              manifestation(s)
            </div>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="text-3xl font-extrabold text-neutral-950">
              {upcomingCount}
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-600">
              date(s) à venir
            </div>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="text-3xl font-extrabold text-neutral-950">
              {publishedCount}
              <span className="ml-2 text-base font-bold text-neutral-400">
                / {draftCount} brouillon(s)
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-600">
              publiée(s)
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-csv-orange">
                <PartyPopper size={20} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-neutral-900">
                  Planning des manifestations
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  Les membres Festivité gèrent uniquement les manifestations,
                  sans accès aux gazettes ni aux annonces Communication.
                </p>
              </div>
            </div>

            <Link
              href="/actualites#manifestations"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              Voir côté public
            </Link>
          </div>

          {manifestations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-5 py-8 text-center">
              <CalendarDays className="mx-auto text-csv-orange" size={28} />
              <p className="mt-3 font-bold text-neutral-900">
                Aucune manifestation enregistrée
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Ajoute la première date pour commencer le planning.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {manifestations.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                            item.isPublished
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-neutral-200 bg-white text-neutral-600"
                          }`}
                        >
                          {item.isPublished ? "Publié" : "Brouillon"}
                        </span>
                        {item.eventDate && item.eventDate >= now ? (
                          <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                            À venir
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-extrabold text-neutral-950">
                        {item.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={15} className="text-csv-orange" />
                          {formatEventDate(item.eventDate)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin size={15} className="text-csv-orange" />
                          {item.location || "Lieu à préciser"}
                        </span>
                      </div>

                      {item.excerpt ? (
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600">
                          {item.excerpt}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/espace-communication/${item.id}/edit?from=festivite`}
                        className="btn-secondary inline-flex items-center justify-center gap-2"
                      >
                        <SquarePen size={15} />
                        Modifier
                      </Link>

                      <form action={togglePublish}>
                        <input type="hidden" name="id" value={item.id} />
                        <FormSubmitButton
                          idleLabel={item.isPublished ? "Dépublier" : "Publier"}
                          pendingLabel="Mise à jour..."
                          loadingTitle="Mise à jour en cours..."
                          loadingDescription="Le statut de la manifestation est en cours de modification."
                          className="btn-secondary"
                          icon={item.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                        />
                      </form>

                      <DeleteNewsItemButton
                        id={item.id}
                        title={item.title}
                        action={deleteManifestation}
                        loadingDescription="La manifestation est en train d’être supprimée."
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
