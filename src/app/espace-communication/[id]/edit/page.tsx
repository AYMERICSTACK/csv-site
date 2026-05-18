import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import DeleteNewsItemButton from "@/components/DeleteNewsItemButton";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import NewsAssetUpload from "@/components/NewsAssetUpload";
import FormSubmitButton from "@/components/ui/FormSubmitButton";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Link as LinkIcon,
  Megaphone,
  Newspaper,
  Save,
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

function toDatetimeLocalValue(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function typeLabel(type: string) {
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

export default async function EditCommunicationContentPage({
  params,
}: PageProps) {
  const { user } = await requireRole(["admin", "communication"]);
  const role = user.role;
  const dashboardHref = role === "admin" ? "/admin" : "/espace-club";
  const dashboardLabel =
    role === "admin" ? "Retour dashboard admin" : "Retour espace club";

  const { id } = await params;

  const item = await prisma.newsItem.findUnique({
    where: { id },
  });

  if (!item) {
    notFound();
  }

  async function updateNewsItem(formData: FormData) {
    "use server";

    await requireRole(["admin", "communication"]);

    const id = String(formData.get("id") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const slugInput = String(formData.get("slug") || "").trim();
    const excerpt = String(formData.get("excerpt") || "").trim();
    const content = String(formData.get("content") || "").trim();
    const type = String(formData.get("type") || "annonce").trim();
    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim();
    const fileUrl = String(formData.get("fileUrl") || "").trim();
    const externalUrl = String(formData.get("externalUrl") || "").trim();
    const eventDateValue = String(formData.get("eventDate") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const sortOrderValue = String(formData.get("sortOrder") || "0").trim();
    const isPublishedValue = String(formData.get("isPublished") || "false");

    if (!id) {
      throw new Error("ID du contenu manquant.");
    }

    if (!title) {
      throw new Error("Le titre est obligatoire.");
    }

    if (!["gazette", "manifestation", "annonce"].includes(type)) {
      throw new Error("Type de contenu invalide.");
    }

    const existingItem = await prisma.newsItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new Error("Contenu introuvable.");
    }

    const slug = slugify(slugInput || title);

    if (!slug) {
      throw new Error("Impossible de générer un slug valide.");
    }

    const duplicate = await prisma.newsItem.findFirst({
      where: {
        slug,
        NOT: { id },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new Error("Un autre contenu avec ce slug existe déjà.");
    }

    const isPublished = isPublishedValue === "true";
    const eventDate = eventDateValue ? new Date(eventDateValue) : null;

    await prisma.newsItem.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content: content || null,
        type,
        coverImageUrl: coverImageUrl || null,
        fileUrl: fileUrl || null,
        externalUrl: externalUrl || null,
        eventDate,
        location: location || null,
        sortOrder: Number.isNaN(Number(sortOrderValue))
          ? 0
          : Number(sortOrderValue),
        isPublished,
        publishedAt: isPublished
          ? existingItem.publishedAt || new Date()
          : null,
      },
    });

    revalidatePath("/actualites");
    revalidatePath("/espace-communication");
    revalidatePath(`/espace-communication/${id}/edit`);

    redirect("/espace-communication?toast=updated");
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

                <Badge>Édition</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={14} />
                  {dashboardLabel}
                </Link>

                <Link
                  href="/espace-communication"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  <ArrowLeft size={14} />
                  Retour communication
                </Link>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Modifier un contenu
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Mets à jour cette actualité, change son statut, ajuste ses
                médias et supprime-la si elle n’est plus utile.
              </p>
            </div>

            <AdminLogoutButton />
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-csv-orange">
                <Newspaper size={20} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-neutral-900">
                  Formulaire d’édition
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  Les champs sont préremplis avec les données actuelles du
                  contenu.
                </p>
              </div>
            </div>

            <form action={updateNewsItem} className="mt-6 space-y-5">
              <input type="hidden" name="id" value={item.id} />

              <div>
                <label htmlFor="title" className="label">
                  Titre
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="input"
                  defaultValue={item.title}
                  required
                />
              </div>

              <div>
                <label htmlFor="slug" className="label">
                  Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  className="input"
                  defaultValue={item.slug}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="type" className="label">
                    Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={item.type}
                    className="input"
                  >
                    <option value="gazette">Gazette</option>
                    <option value="manifestation">Manifestation</option>
                    <option value="annonce">Annonce</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sortOrder" className="label">
                    Ordre d’affichage
                  </label>
                  <input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    min="0"
                    defaultValue={item.sortOrder}
                    className="input"
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50/50 p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-csv-orange shadow-sm">
                    <CalendarDays size={18} />
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-neutral-900">
                      Manifestation : deux usages possibles
                    </h3>

                    <div className="mt-3 grid gap-3 text-sm leading-relaxed text-neutral-700 md:grid-cols-2">
                      <div className="rounded-2xl border border-orange-100 bg-white p-4">
                        <span className="font-bold text-neutral-950">Avec affiche :</span>{" "}
                        ajoute une image ou un fichier pour mettre l’événement en avant sur la page actualités.
                      </div>

                      <div className="rounded-2xl border border-orange-100 bg-white p-4">
                        <span className="font-bold text-neutral-950">Date simple :</span>{" "}
                        renseigne seulement le titre, la date et le lieu. L’événement apparaîtra dans “Toutes les dates”.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="excerpt" className="label">
                  Extrait
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  rows={3}
                  className="input"
                  defaultValue={item.excerpt || ""}
                />
              </div>

              <div>
                <label htmlFor="content" className="label">
                  Contenu détaillé
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={6}
                  className="input"
                  defaultValue={item.content || ""}
                />
              </div>

              <div className="space-y-4 rounded-[1.25rem] border border-orange-100 bg-orange-50/30 p-4">
                <NewsAssetUpload
                  label="Image de couverture"
                  name="coverImageUrl"
                  defaultValue={item.coverImageUrl || ""}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  placeholder="URL de l’image de couverture"
                  helpText="Tu peux conserver l’URL existante, en coller une autre ou envoyer directement une nouvelle image."
                />

                <NewsAssetUpload
                  label="Fichier principal (PDF / image)"
                  name="fileUrl"
                  defaultValue={item.fileUrl || ""}
                  accept="application/pdf,image/png,image/jpeg,image/webp,image/jpg"
                  placeholder="URL du fichier principal"
                  helpText="Idéal pour remplacer une gazette PDF, une affiche JPG/PNG ou un document du club."
                />
              </div>

              <div>
                <label htmlFor="externalUrl" className="label">
                  URL externe
                </label>
                <input
                  id="externalUrl"
                  name="externalUrl"
                  type="text"
                  className="input"
                  defaultValue={item.externalUrl || ""}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="eventDate" className="label">
                    Date / heure de la manifestation
                  </label>
                  <input
                    id="eventDate"
                    name="eventDate"
                    type="datetime-local"
                    className="input"
                    defaultValue={toDatetimeLocalValue(item.eventDate)}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                    Pour une date simple agenda, ce champ suffit avec le titre.
                  </p>
                </div>

                <div>
                  <label htmlFor="location" className="label">
                    Lieu
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    className="input"
                    defaultValue={item.location || ""}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                    Optionnel mais recommandé pour les manifestations.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="isPublished" className="label">
                  Statut
                </label>
                <select
                  id="isPublished"
                  name="isPublished"
                  defaultValue={item.isPublished ? "true" : "false"}
                  className="input"
                >
                  <option value="false">Brouillon</option>
                  <option value="true">Publié</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <FormSubmitButton
                  idleLabel="Enregistrer les modifications"
                  pendingLabel="Enregistrement..."
                  loadingTitle="Enregistrement en cours..."
                  loadingDescription="Les modifications sont en train d’être sauvegardées."
                  className="btn-primary"
                  icon={<Save size={16} />}
                />

                <Link href="/espace-communication" className="btn-secondary">
                  Annuler
                </Link>
              </div>
            </form>

            <div className="mt-6">
              <DeleteNewsItemButton
                id={item.id}
                title={item.title}
                action={deleteNewsItem}
              />
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-orange-400">
                <Megaphone size={20} />
              </div>

              <h2 className="mt-4 text-xl font-extrabold tracking-tight">
                Aperçu du contenu
              </h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                    Type
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">
                    {typeLabel(item.type)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                    Titre actuel
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">
                    {item.title}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                    Statut
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">
                    {item.isPublished ? "Publié" : "Brouillon"}
                  </div>
                </div>

                {item.coverImageUrl ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                      Couverture actuelle
                    </div>
                    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-csv-orange">
                  <CalendarDays size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-neutral-900">
                    Conseils rapides
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Selon le type de contenu, certains champs sont plus utiles
                    que d’autres.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-neutral-700">
                <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                  <span className="font-bold text-neutral-900">Gazette :</span>{" "}
                  favorise une image de couverture + un fichier PDF ou image.
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                  <span className="font-bold text-neutral-900">
                    Manifestation :
                  </span>{" "}
                  ajoute une date et un lieu. L’image est optionnelle : sans affiche, l’événement reste visible dans “Toutes les dates”.
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                  <span className="font-bold text-neutral-900">Annonce :</span>{" "}
                  garde un extrait court et clair.
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-csv-orange">
                  <LinkIcon size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-neutral-900">
                    Liens utiles
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Accès rapides vers les pages liées au module.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Link
                  href="/espace-communication"
                  className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-orange-50"
                >
                  <span>Retour au dashboard communication</span>
                  <ArrowLeft size={16} className="text-csv-orange" />
                </Link>

                <Link
                  href="/actualites"
                  className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                >
                  <span>Voir la page publique actualités</span>
                  <LinkIcon size={16} className="text-csv-orange" />
                </Link>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-orange-400">
                <FileText size={20} />
              </div>

              <h2 className="mt-4 text-xl font-extrabold tracking-tight">
                Média & fichiers
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Utilise l’upload pour récupérer rapidement une URL Vercel Blob,
                ou colle directement une URL existante dans le champ
                correspondant.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Container>
  );
}
