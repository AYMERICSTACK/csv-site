import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

function slugifyFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function requireSponsoringAccess() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.user?.role;

  if (role !== "admin" && role !== "sponsoring") {
    redirect("/espace-club/profil");
  }

  return session;
}

export default async function EditPartnerPage({ params }: PageProps) {
  const session = await requireSponsoringAccess();
  const { id } = await params;

  const partner = await prisma.partner.findUnique({
    where: { id },
  });

  if (!partner) {
    redirect("/espace-sponsoring");
  }

  async function updatePartner(formData: FormData) {
    "use server";

    await requireSponsoringAccess();

    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const websiteUrl = String(formData.get("websiteUrl") || "").trim();
    const sortOrderValue = String(formData.get("sortOrder") || "0").trim();
    const isActiveValue = String(formData.get("isActive") || "false").trim();
    const removeLogoValue = String(
      formData.get("removeLogo") || "false",
    ).trim();
    const logoFile = formData.get("logoFile");

    if (!id) {
      throw new Error("ID partenaire manquant.");
    }

    if (!name) {
      throw new Error("Le nom du partenaire est obligatoire.");
    }

    const existing = await prisma.partner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Partenaire introuvable.");
    }

    let nextLogoUrl = existing.logoUrl;

    if (removeLogoValue === "true") {
      nextLogoUrl = null;
    }

    if (logoFile instanceof File && logoFile.size > 0) {
      const safeName = slugifyFileName(logoFile.name || "logo");
      const blob = await put(`partners/${Date.now()}-${safeName}`, logoFile, {
        access: "public",
      });

      nextLogoUrl = blob.url;
    }

    await prisma.partner.update({
      where: { id },
      data: {
        name,
        description: description || null,
        websiteUrl: websiteUrl || null,
        sortOrder: sortOrderValue ? Number(sortOrderValue) : 0,
        isActive: isActiveValue === "true",
        logoUrl: nextLogoUrl,
      },
    });

    revalidatePath("/espace-sponsoring");
    revalidatePath(`/espace-sponsoring/${id}/edit`);
    revalidatePath("/partenaires");

    redirect("/espace-sponsoring");
  }

  return (
    <Container>
      <div className="py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Espace privé</Badge>
              <Badge>Sponsoring</Badge>
              <Badge>Édition</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Modifier un partenaire
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Mets à jour les informations, la visibilité et le logo du
              partenaire.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-neutral-900">
              Formulaire d’édition
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Les changements seront répercutés dans l’espace sponsoring et sur
              la page publique si le partenaire est actif.
            </p>

            <form action={updatePartner} className="mt-6 space-y-5">
              <input type="hidden" name="id" value={partner.id} />

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
                  defaultValue={partner.name}
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
                  defaultValue={partner.description || ""}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                />
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
                  defaultValue={partner.websiteUrl || ""}
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
                  defaultValue={partner.sortOrder}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                />
              </div>

              <div>
                <label
                  htmlFor="isActive"
                  className="mb-2 block text-sm font-semibold text-neutral-900"
                >
                  Visibilité
                </label>
                <select
                  id="isActive"
                  name="isActive"
                  defaultValue={partner.isActive ? "true" : "false"}
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-csv-orange"
                >
                  <option value="true">
                    Actif (visible sur la page publique)
                  </option>
                  <option value="false">
                    Masqué (non visible publiquement)
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="logoFile"
                  className="mb-2 block text-sm font-semibold text-neutral-900"
                >
                  Remplacer le logo
                </label>
                <input
                  id="logoFile"
                  name="logoFile"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-neutral-200"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Laisse vide si tu veux conserver le logo actuel.
                </p>
              </div>

              {partner.logoUrl ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <label className="flex items-center gap-3 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      name="removeLogo"
                      value="true"
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    Supprimer le logo actuel
                  </label>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-csv-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Enregistrer les modifications
                </button>

                <a
                  href="/espace-sponsoring"
                  className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                >
                  Retour
                </a>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-neutral-900">
                Aperçu actuel
              </h2>

              <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="flex items-center gap-4">
                  {partner.logoUrl ? (
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="h-16 w-16 rounded-2xl border border-neutral-200 bg-white object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-xs font-semibold text-neutral-400">
                      No logo
                    </div>
                  )}

                  <div>
                    <div className="text-lg font-extrabold text-neutral-900">
                      {partner.name}
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      Ordre : {partner.sortOrder}
                    </div>
                    <div className="mt-2">
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
                </div>

                {partner.description ? (
                  <p className="mt-4 text-sm leading-relaxed text-neutral-700">
                    {partner.description}
                  </p>
                ) : null}

                {partner.websiteUrl ? (
                  <p className="mt-3 text-sm text-neutral-700">
                    <span className="font-semibold text-neutral-900">
                      Site :
                    </span>{" "}
                    <a
                      href={partner.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      {partner.websiteUrl}
                    </a>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm text-sm text-neutral-700">
              <p>
                <span className="font-semibold text-neutral-900">
                  Connecté :
                </span>{" "}
                {session.user?.name || session.user?.email || "Utilisateur"}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-neutral-900">Rôle :</span>{" "}
                {session.user?.role}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-neutral-900">
                  Accès autorisé :
                </span>{" "}
                admin + sponsoring
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
