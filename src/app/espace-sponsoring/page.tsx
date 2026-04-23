import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";
import {
  ArrowLeft,
  BadgeEuro,
  Building2,
  Eye,
  EyeOff,
  Globe,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

async function createPartner(formData: FormData) {
  "use server";

  await requireRole(["admin", "sponsoring"]);

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const websiteUrl = String(formData.get("websiteUrl") || "").trim();
  const sortOrderValue = String(formData.get("sortOrder") || "0").trim();
  const logoFile = formData.get("logoFile");

  if (!name) {
    throw new Error("Le nom du partenaire est obligatoire.");
  }

  let logoUrl: string | null = null;

  if (logoFile instanceof File && logoFile.size > 0) {
    const bytes = await logoFile.arrayBuffer();
    const fileForUpload = new File([bytes], logoFile.name, {
      type: logoFile.type,
    });

    const { put } = await import("@vercel/blob");

    const safeName = logoFile.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    const blob = await put(
      `partners/${Date.now()}-${safeName}`,
      fileForUpload,
      {
        access: "public",
      },
    );

    logoUrl = blob.url;
  }

  await prisma.partner.create({
    data: {
      name,
      description: description || null,
      logoUrl,
      websiteUrl: websiteUrl || null,
      sortOrder: sortOrderValue ? Number(sortOrderValue) : 0,
      isActive: true,
    },
  });

  revalidatePath("/espace-sponsoring");
  revalidatePath("/partenaires");
}

async function togglePartnerActive(formData: FormData) {
  "use server";

  await requireRole(["admin", "sponsoring"]);

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("ID partenaire manquant.");
  }

  const existing = await prisma.partner.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Partenaire introuvable.");
  }

  await prisma.partner.update({
    where: { id },
    data: {
      isActive: !existing.isActive,
    },
  });

  revalidatePath("/espace-sponsoring");
  revalidatePath("/partenaires");
}

async function deletePartner(formData: FormData) {
  "use server";

  await requireRole(["admin", "sponsoring"]);

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("ID partenaire manquant.");
  }

  await prisma.partner.delete({
    where: { id },
  });

  revalidatePath("/espace-sponsoring");
  revalidatePath("/partenaires");
}

export default async function EspaceSponsoringPage() {
  const session = await requireRole(["admin", "sponsoring"]);

  const partners = await prisma.partner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const role = session.user?.role;
  const dashboardHref = role === "admin" ? "/admin" : "/espace-club";
  const dashboardLabel =
    role === "admin" ? "Retour dashboard admin" : "Retour espace club";

  const activeCount = partners.filter((partner) => partner.isActive).length;
  const hiddenCount = partners.filter((partner) => !partner.isActive).length;

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

                <Link href="/espace-sponsoring">
                  <Badge>Sponsoring</Badge>
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
                Espace sponsoring
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Gère les partenaires du club, leur visibilité, leur logo et leur
                ordre d’affichage sur la future page publique partenaires.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  {partners.length} partenaire{partners.length > 1 ? "s" : ""}
                </div>

                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  {activeCount} actif{activeCount > 1 ? "s" : ""}
                </div>

                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  {hiddenCount} masqué{hiddenCount > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <AdminLogoutButton />
          </div>
        </section>

        <div className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-csv-orange">
                  <BadgeEuro size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">
                    Ajouter un partenaire
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    Remplis les informations principales pour commencer à
                    construire la vitrine sponsoring du club.
                  </p>
                </div>
              </div>

              <form action={createPartner} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-neutral-900"
                  >
                    Nom
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Ex : Garage Viriat Auto"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-semibold text-neutral-900"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Ex : Partenaire local historique du club..."
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                  />
                </div>

                <div>
                  <label
                    htmlFor="logoFile"
                    className="mb-2 block text-sm font-semibold text-neutral-900"
                  >
                    Logo du partenaire
                  </label>
                  <input
                    id="logoFile"
                    name="logoFile"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-neutral-200"
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Formats autorisés : PNG, JPG, JPEG, WEBP — 5 Mo max.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="websiteUrl"
                    className="mb-2 block text-sm font-semibold text-neutral-900"
                  >
                    Site web
                  </label>
                  <input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="text"
                    placeholder="Ex : https://example.com"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sortOrder"
                    className="mb-2 block text-sm font-semibold text-neutral-900"
                  >
                    Ordre d’affichage
                  </label>
                  <input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-csv-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Plus size={16} />
                  Ajouter le partenaire
                </button>
              </form>
            </section>

            <section className="rounded-[1.75rem] border border-neutral-800 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              <h2 className="text-xl font-extrabold tracking-tight">
                Vision sponsoring
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Cet espace servira à structurer la vitrine partenaires du club
                avec une gestion simple, claire et valorisante.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">Visibilité</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Mettre en avant les partenaires actifs du club avec un ordre
                    d’affichage maîtrisé.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">
                    Organisation
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Centraliser logos, descriptions et liens web dans un espace
                    unique.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white">
                    Valorisation
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Préparer une future page publique partenaires plus propre et
                    plus crédible.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900">
                    Partenaires enregistrés
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    Liste privée des partenaires gérés par la commission
                    sponsoring.
                  </p>
                </div>

                <div className="rounded-full bg-csv-orange/10 px-3 py-1 text-xs font-bold text-csv-black">
                  {partners.length} partenaire{partners.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <p>
                  <span className="font-semibold text-neutral-900">
                    Connecté :
                  </span>{" "}
                  {session.user?.name || session.user?.email || "Utilisateur"}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-neutral-900">Rôle :</span>{" "}
                  {role}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-neutral-900">
                    Accès autorisé :
                  </span>{" "}
                  admin + sponsoring
                </p>
              </div>

              {partners.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
                  Aucun partenaire enregistré pour le moment.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {partners.map((partner) => (
                    <article
                      key={partner.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            {partner.logoUrl ? (
                              <img
                                src={partner.logoUrl}
                                alt={partner.name}
                                className="h-12 w-12 rounded-xl border border-neutral-200 bg-white object-contain p-1"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-400">
                                <Building2 size={18} />
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-base font-extrabold text-neutral-900">
                                {partner.name}
                              </div>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                  partner.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-neutral-200 text-neutral-700"
                                }`}
                              >
                                {partner.isActive ? "Actif" : "Masqué"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2 text-sm text-neutral-700">
                            <div>
                              <span className="font-semibold text-neutral-900">
                                Ordre :
                              </span>{" "}
                              {partner.sortOrder}
                            </div>

                            {partner.description ? (
                              <div>
                                <span className="font-semibold text-neutral-900">
                                  Description :
                                </span>{" "}
                                {partner.description}
                              </div>
                            ) : null}

                            {partner.websiteUrl ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-neutral-900">
                                  Site :
                                </span>
                                <a
                                  href={partner.websiteUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 underline underline-offset-2"
                                >
                                  {partner.websiteUrl}
                                  <Globe size={14} />
                                </a>
                              </div>
                            ) : null}

                            {partner.logoUrl ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-neutral-900">
                                  Logo :
                                </span>
                                <a
                                  href={partner.logoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 underline underline-offset-2"
                                >
                                  Voir le logo
                                  <Upload size={14} />
                                </a>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <a
                            href={`/espace-sponsoring/${partner.id}/edit`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
                          >
                            <Pencil size={14} />
                            Modifier
                          </a>

                          <form action={togglePartnerActive}>
                            <input type="hidden" name="id" value={partner.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
                            >
                              {partner.isActive ? (
                                <>
                                  <EyeOff size={14} />
                                  Masquer
                                </>
                              ) : (
                                <>
                                  <Eye size={14} />
                                  Activer
                                </>
                              )}
                            </button>
                          </form>

                          <form action={deletePartner}>
                            <input type="hidden" name="id" value={partner.id} />
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
        </div>
      </div>
    </Container>
  );
}
