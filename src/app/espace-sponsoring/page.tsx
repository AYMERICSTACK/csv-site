import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";

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

async function uploadPartnerLogo(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/partners/upload-logo`, {
    method: "POST",
    body: formData,
    headers: {
      Cookie: "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Impossible d’uploader le logo.");
  }

  const data = await response.json();
  return data.url as string;
}

async function createPartner(formData: FormData) {
  "use server";

  await requireSponsoringAccess();

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

  await requireSponsoringAccess();

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

  await requireSponsoringAccess();

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
  const session = await requireSponsoringAccess();

  const partners = await prisma.partner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const role = session.user?.role;

  return (
    <Container>
      <div className="py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Espace privé</Badge>
              <Badge>Sponsoring</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Espace sponsoring
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Gère les partenaires du club, leur visibilité et leur ordre
              d’affichage sur la future page publique.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-neutral-900">
              Ajouter un partenaire
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Remplis les informations principales du partenaire pour commencer
              à construire la vitrine sponsoring du club.
            </p>

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
                className="inline-flex items-center justify-center rounded-2xl bg-csv-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Ajouter le partenaire
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
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
                          ) : null}

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
                            <div>
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
                            </div>
                          ) : null}

                          {partner.logoUrl ? (
                            <div>
                              <span className="font-semibold text-neutral-900">
                                Logo :
                              </span>{" "}
                              <a
                                href={partner.logoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2"
                              >
                                Voir le logo
                              </a>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`/espace-sponsoring/${partner.id}/edit`}
                          className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
                        >
                          Modifier
                        </a>

                        <form action={togglePartnerActive}>
                          <input type="hidden" name="id" value={partner.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
                          >
                            {partner.isActive ? "Masquer" : "Activer"}
                          </button>
                        </form>

                        <form action={deletePartner}>
                          <input type="hidden" name="id" value={partner.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
