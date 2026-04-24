import Link from "next/link";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, FileText, Plus, Save, Trash2 } from "lucide-react";
import RegistrationDocumentUpload from "@/components/RegistrationDocumentUpload";

const steps = [
  {
    title: "Préparer le dossier",
    text: "Télécharger la fiche d’inscription et réunir les documents demandés.",
  },
  {
    title: "Compléter & signer",
    text: "Remplir le dossier et vérifier les informations.",
  },
  {
    title: "Déposer au club",
    text: "Déposer le dossier complet lors des permanences.",
  },
];

export default async function ManageInscriptionsPage() {
  await requireRole(["admin", "licence"]);

  const settings =
    (await prisma.registrationSettings.findFirst()) ||
    (await prisma.registrationSettings.create({
      data: {
        id: "default-registration-settings",
        seasonLabel: "Saison 2026",
        introTitle: "S’inscrire au CS Viriat (CSV)",
        introText:
          "Retrouvez ici les informations officielles pour l’inscription : étapes, documents, contacts et informations pratiques.",
        periodText: "juin → septembre",
        contactEmail: "csviriat-football@orange.fr",
      },
    }));

  const fees = await prisma.registrationFee.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const documents = await prisma.registrationDocument.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  async function updateSettings(formData: FormData) {
    "use server";

    await requireRole(["admin", "licence"]);

    const seasonLabel = String(formData.get("seasonLabel") || "").trim();
    const introTitle = String(formData.get("introTitle") || "").trim();
    const introText = String(formData.get("introText") || "").trim();
    const periodText = String(formData.get("periodText") || "").trim();
    const contactEmail = String(formData.get("contactEmail") || "").trim();
    const helloAssoUrl = String(formData.get("helloAssoUrl") || "").trim();
    const cardPaymentUrl = String(formData.get("cardPaymentUrl") || "").trim();

    await prisma.registrationSettings.update({
      where: { id: settings.id },
      data: {
        seasonLabel: seasonLabel || "Saison 2026",
        introTitle: introTitle || "S’inscrire au CS Viriat (CSV)",
        introText:
          introText ||
          "Retrouvez ici les informations officielles pour l’inscription : étapes, documents, contacts et informations pratiques.",
        periodText: periodText || "juin → septembre",
        contactEmail: contactEmail || "csviriat-football@orange.fr",
        helloAssoUrl: helloAssoUrl || null,
        cardPaymentUrl: cardPaymentUrl || null,
      },
    });

    revalidatePath("/inscriptions");
    revalidatePath("/espace-licence/inscriptions");
  }

  async function addFee(formData: FormData) {
    "use server";

    await requireRole(["admin", "licence"]);

    const category = String(formData.get("category") || "").trim();
    const fee = String(formData.get("fee") || "").trim();
    const tombola = String(formData.get("tombola") || "").trim();
    const sortOrder = Number(formData.get("sortOrder") || 0);

    if (!category || !fee) return;

    await prisma.registrationFee.create({
      data: {
        category,
        fee,
        tombola: tombola || null,
        sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      },
    });

    revalidatePath("/inscriptions");
    revalidatePath("/espace-licence/inscriptions");
  }

  async function updateFee(formData: FormData) {
    "use server";

    await requireRole(["admin", "licence"]);

    const id = String(formData.get("id") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const fee = String(formData.get("fee") || "").trim();
    const tombola = String(formData.get("tombola") || "").trim();
    const sortOrder = Number(formData.get("sortOrder") || 0);

    if (!id || !category || !fee) return;

    await prisma.registrationFee.update({
      where: { id },
      data: {
        category,
        fee,
        tombola: tombola || null,
        sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      },
    });

    revalidatePath("/inscriptions");
    revalidatePath("/espace-licence/inscriptions");
  }

  async function deleteFee(formData: FormData) {
    "use server";

    await requireRole(["admin", "licence"]);

    const id = String(formData.get("id") || "").trim();
    if (!id) return;

    await prisma.registrationFee.delete({
      where: { id },
    });

    revalidatePath("/inscriptions");
    revalidatePath("/espace-licence/inscriptions");
  }

  async function addDocument(formData: FormData) {
    "use server";

    await requireRole(["admin", "licence"]);

    const name = String(formData.get("name") || "").trim();
    const fileUrl = String(formData.get("fileUrl") || "").trim();
    const status = String(formData.get("status") || "À venir").trim();
    const sortOrder = Number(formData.get("sortOrder") || 0);

    if (!name) return;

    await prisma.registrationDocument.create({
      data: {
        name,
        fileUrl: fileUrl || null,
        status,
        sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      },
    });

    revalidatePath("/inscriptions");
    revalidatePath("/espace-licence/inscriptions");
  }

  async function updateDocument(formData: FormData) {
    "use server";

    await requireRole(["admin", "licence"]);

    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const fileUrl = String(formData.get("fileUrl") || "").trim();
    const status = String(formData.get("status") || "À venir").trim();
    const sortOrder = Number(formData.get("sortOrder") || 0);

    if (!id || !name) return;

    await prisma.registrationDocument.update({
      where: { id },
      data: {
        name,
        fileUrl: fileUrl || null,
        status,
        sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      },
    });

    revalidatePath("/inscriptions");
    revalidatePath("/espace-licence/inscriptions");
  }

  async function deleteDocument(formData: FormData) {
    "use server";

    await requireRole(["admin", "licence"]);

    const id = String(formData.get("id") || "").trim();
    if (!id) return;

    await prisma.registrationDocument.delete({
      where: { id },
    });

    revalidatePath("/inscriptions");
    revalidatePath("/espace-licence/inscriptions");
  }

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950 px-6 py-8 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.22),transparent_24%)]" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Espace licence</Badge>
                <Badge>Inscriptions</Badge>
                <Badge>{settings.seasonLabel}</Badge>
              </div>

              <Link
                href="/espace-licence"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                <ArrowLeft size={14} />
                Retour espace licence
              </Link>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
                Gestion de la page inscriptions
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Modifie les informations visibles sur la page publique : saison,
                textes, tarifs, documents et liens de paiement.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/inscriptions">Voir la page publique</Button>
              </div>
            </div>

            <AdminLogoutButton />
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Prévisualisation</Badge>
            <Badge>{settings.seasonLabel}</Badge>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900">
            {settings.introTitle}
          </h2>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-700">
            {settings.introText}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.5rem] border border-orange-100 bg-white p-5 shadow-sm"
              >
                <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">
                  Étape {index + 1}
                </div>

                <div className="mt-4 text-base font-extrabold text-neutral-900">
                  {step.title}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-neutral-900">
            Paramètres généraux
          </h2>

          <form action={updateSettings} className="mt-6 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-900">
                  Saison
                </label>
                <input
                  name="seasonLabel"
                  defaultValue={settings.seasonLabel}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-900">
                  Période d’inscription
                </label>
                <input
                  name="periodText"
                  defaultValue={settings.periodText}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Titre principal
              </label>
              <input
                name="introTitle"
                defaultValue={settings.introTitle}
                className="input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Texte d’introduction
              </label>
              <textarea
                name="introText"
                defaultValue={settings.introText}
                rows={4}
                className="input"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-900">
                  Email contact
                </label>
                <input
                  name="contactEmail"
                  defaultValue={settings.contactEmail}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-900">
                  Lien HelloAsso
                </label>
                <input
                  name="helloAssoUrl"
                  defaultValue={settings.helloAssoUrl || ""}
                  className="input"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-900">
                  Lien CB
                </label>
                <input
                  name="cardPaymentUrl"
                  defaultValue={settings.cardPaymentUrl || ""}
                  className="input"
                  placeholder="https://..."
                />
              </div>
            </div>

            <button className="inline-flex w-fit items-center gap-2 rounded-2xl bg-csv-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              <Save size={16} />
              Enregistrer les paramètres
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-neutral-900">Tarifs</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Ces tarifs sont affichés sur la page publique inscriptions.
            </p>

            <div className="mt-6 space-y-4">
              {fees.map((fee) => (
                <form
                  key={fee.id}
                  action={updateFee}
                  className="rounded-[1.35rem] border border-orange-100 bg-gradient-to-br from-white to-orange-50/35 p-5"
                >
                  <input type="hidden" name="id" value={fee.id} />

                  <div className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.4fr]">
                    <input
                      name="category"
                      defaultValue={fee.category}
                      className="input"
                      placeholder="Catégorie"
                    />
                    <input
                      name="fee"
                      defaultValue={fee.fee}
                      className="input"
                      placeholder="Cotisation"
                    />
                    <input
                      name="tombola"
                      defaultValue={fee.tombola || ""}
                      className="input"
                      placeholder="Tombola"
                    />
                    <input
                      name="sortOrder"
                      type="number"
                      defaultValue={fee.sortOrder}
                      className="input"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white">
                      <Save size={14} />
                      Sauver
                    </button>

                    <button
                      formAction={deleteFee}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600"
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </form>
              ))}
            </div>

            <form
              action={addFee}
              className="mt-6 rounded-[1.35rem] border border-dashed border-orange-200 bg-orange-50/40 p-5"
            >
              <h3 className="text-sm font-bold text-neutral-900">
                Ajouter un tarif
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.4fr]">
                <input
                  name="category"
                  className="input"
                  placeholder="Catégorie"
                />
                <input name="fee" className="input" placeholder="Cotisation" />
                <input name="tombola" className="input" placeholder="Tombola" />
                <input
                  name="sortOrder"
                  type="number"
                  className="input"
                  placeholder="Ordre"
                />
              </div>

              <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-csv-orange px-4 py-2 text-sm font-semibold text-white">
                <Plus size={14} />
                Ajouter le tarif
              </button>
            </form>
          </div>

          <div className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-neutral-900">
              Documents
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Ajoute les liens PDF ou marque les documents comme bientôt
              disponibles.
            </p>

            <div className="mt-6 space-y-4">
              {documents.map((document) => (
                <form
                  key={document.id}
                  action={updateDocument}
                  className="rounded-[1.35rem] border border-orange-100 bg-gradient-to-r from-white to-orange-50/25 p-5"
                >
                  <input type="hidden" name="id" value={document.id} />

                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-csv-orange/10 text-csv-orange">
                      <FileText size={18} />
                    </div>

                    <div className="w-full space-y-3">
                      <input
                        name="name"
                        defaultValue={document.name}
                        className="input"
                        placeholder="Nom du document"
                      />

                      <RegistrationDocumentUpload
                        name="fileUrl"
                        defaultValue={document.fileUrl || ""}
                      />

                      <div className="grid gap-3 md:grid-cols-2">
                        <select
                          name="status"
                          defaultValue={document.status}
                          className="input"
                        >
                          <option value="À venir">À venir</option>
                          <option value="Disponible">Disponible</option>
                        </select>

                        <input
                          name="sortOrder"
                          type="number"
                          defaultValue={document.sortOrder}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-csv-black px-4 py-2 text-sm font-semibold text-white">
                      <Save size={14} />
                      Sauver
                    </button>

                    <button
                      formAction={deleteDocument}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600"
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </form>
              ))}
            </div>

            <form
              action={addDocument}
              className="mt-6 rounded-[1.35rem] border border-dashed border-orange-200 bg-orange-50/40 p-5"
            >
              <h3 className="text-sm font-bold text-neutral-900">
                Ajouter un document
              </h3>

              <div className="mt-4 space-y-3">
                <input name="name" className="input" placeholder="Nom du PDF" />
                <RegistrationDocumentUpload name="fileUrl" />
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    name="status"
                    defaultValue="À venir"
                    className="input"
                  >
                    <option value="À venir">À venir</option>
                    <option value="Disponible">Disponible</option>
                  </select>
                  <input
                    name="sortOrder"
                    type="number"
                    className="input"
                    placeholder="Ordre"
                  />
                </div>
              </div>

              <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-csv-orange px-4 py-2 text-sm font-semibold text-white">
                <Plus size={14} />
                Ajouter le document
              </button>
            </form>
          </div>
        </section>
      </div>
    </Container>
  );
}
