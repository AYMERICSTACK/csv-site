import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Plus, Save, Trash2, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import Container from "@/components/Container";
import { prisma } from "@/lib/prisma";

const STAFF_SECTIONS = [
  "Bureau",
  "Responsables par catégories",
  "Référents",
  "Technique / Pôle sportif",
];

async function canManageStaff() {
  const session = await auth();

  if (session?.user?.role === "admin") {
    return true;
  }

  if (!session?.user?.id) {
    return false;
  }

  const membership = await prisma.commissionMembership.findFirst({
    where: {
      userId: session.user.id,
      commission: {
        slug: "bureau",
      },
    },
  });

  return !!membership;
}

async function addStaffMember(formData: FormData) {
  "use server";

  const allowed = await canManageStaff();

  if (!allowed) {
    redirect("/");
  }

  const name = String(formData.get("name") || "").trim();
  const roleLabel = String(formData.get("roleLabel") || "").trim();
  const sectionTitle = String(formData.get("sectionTitle") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const isPublished = formData.get("isPublished") === "on";

  if (!name || !roleLabel || !sectionTitle) {
    return;
  }

  await prisma.staffMember.create({
    data: {
      name,
      roleLabel,
      sectionTitle,
      email: email || null,
      phone: phone || null,
      sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      isPublished,
    },
  });

  revalidatePath("/admin/staff");
  revalidatePath("/club/staff");
}

async function updateStaffMember(formData: FormData) {
  "use server";

  const allowed = await canManageStaff();

  if (!allowed) {
    redirect("/");
  }

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const roleLabel = String(formData.get("roleLabel") || "").trim();
  const sectionTitle = String(formData.get("sectionTitle") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const isPublished = formData.get("isPublished") === "on";

  if (!id || !name || !roleLabel || !sectionTitle) {
    return;
  }

  await prisma.staffMember.update({
    where: { id },
    data: {
      name,
      roleLabel,
      sectionTitle,
      email: email || null,
      phone: phone || null,
      sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      isPublished,
    },
  });

  revalidatePath("/admin/staff");
  revalidatePath("/club/staff");
}

async function deleteStaffMember(formData: FormData) {
  "use server";

  const allowed = await canManageStaff();

  if (!allowed) {
    redirect("/");
  }

  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  await prisma.staffMember.delete({
    where: { id },
  });

  revalidatePath("/admin/staff");
  revalidatePath("/club/staff");
}

export default async function AdminStaffPage() {
  const allowed = await canManageStaff();

  if (!allowed) {
    redirect("/");
  }

  const staffMembers = await prisma.staffMember.findMany({
    orderBy: [{ sectionTitle: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <Container>
      <div className="py-10">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
              <UsersRound className="h-3.5 w-3.5" />
              Administration
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-950">
              Staff & organigramme
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
              Gérez les membres affichés sur la page publique du staff : bureau,
              référents, responsables par catégories et pôle sportif.
            </p>
          </div>

          <Link
            href="/club/staff"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-800 transition hover:bg-neutral-50"
          >
            Voir la page publique
          </Link>
        </div>

        <section className="mt-8 rounded-[2rem] border border-orange-100 bg-orange-50/40 p-5">
          <h2 className="text-lg font-extrabold text-neutral-950">
            Ajouter un membre
          </h2>

          <form
            action={addStaffMember}
            className="mt-5 grid gap-4 xl:grid-cols-12"
          >
            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Nom complet
              </label>
              <input
                name="name"
                placeholder="Ex : VALLIER Christophe"
                className="input"
              />
            </div>

            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Fonction
              </label>
              <input
                name="roleLabel"
                placeholder="Ex : Président"
                className="input"
              />
            </div>

            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Section
              </label>
              <select name="sectionTitle" defaultValue="" className="input">
                <option value="" disabled>
                  Choisir une section
                </option>
                {STAFF_SECTIONS.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-1">
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Ordre
              </label>
              <input
                type="number"
                name="sortOrder"
                defaultValue={0}
                className="input"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Publication
              </label>
              <label className="flex h-[46px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700">
                <input
                  type="checkbox"
                  name="isPublished"
                  defaultChecked
                  className="h-4 w-4 accent-orange-500"
                />
                Publié
              </label>
            </div>

            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="optionnel"
                className="input"
              />
            </div>

            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Téléphone
              </label>
              <input name="phone" placeholder="optionnel" className="input" />
            </div>

            <div className="flex items-end xl:col-span-6">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 md:w-auto">
                <Plus className="h-4 w-4" />
                Ajouter le membre
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 space-y-4">
          {staffMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <form
                action={updateStaffMember}
                className="grid gap-4 xl:grid-cols-12"
              >
                <input type="hidden" name="id" value={member.id} />

                <div className="xl:col-span-3">
                  <label className="mb-2 block text-sm font-semibold text-neutral-900">
                    Nom complet
                  </label>
                  <input
                    name="name"
                    defaultValue={member.name}
                    className="input"
                  />
                </div>

                <div className="xl:col-span-3">
                  <label className="mb-2 block text-sm font-semibold text-neutral-900">
                    Fonction
                  </label>
                  <input
                    name="roleLabel"
                    defaultValue={member.roleLabel}
                    className="input"
                  />
                </div>

                <div className="xl:col-span-3">
                  <label className="mb-2 block text-sm font-semibold text-neutral-900">
                    Section
                  </label>
                  <select
                    name="sectionTitle"
                    defaultValue={member.sectionTitle}
                    className="input"
                  >
                    {STAFF_SECTIONS.map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="xl:col-span-1">
                  <label className="mb-2 block text-sm font-semibold text-neutral-900">
                    Ordre
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    defaultValue={member.sortOrder}
                    className="input"
                  />
                </div>

                <div className="xl:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-neutral-900">
                    Statut
                  </label>
                  <label className="flex h-[46px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700">
                    <input
                      type="checkbox"
                      name="isPublished"
                      defaultChecked={member.isPublished}
                      className="h-4 w-4 accent-orange-500"
                    />
                    {member.isPublished ? (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-4 w-4 text-emerald-600" />
                        Publié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <EyeOff className="h-4 w-4 text-neutral-400" />
                        Masqué
                      </span>
                    )}
                  </label>
                </div>

                <div className="xl:col-span-3">
                  <label className="mb-2 block text-sm font-semibold text-neutral-900">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={member.email ?? ""}
                    placeholder="optionnel"
                    className="input"
                  />
                </div>

                <div className="xl:col-span-3">
                  <label className="mb-2 block text-sm font-semibold text-neutral-900">
                    Téléphone
                  </label>
                  <input
                    name="phone"
                    defaultValue={member.phone ?? ""}
                    placeholder="optionnel"
                    className="input"
                  />
                </div>

                <div className="flex items-end gap-3 xl:col-span-6">
                  <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-neutral-800">
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </button>
                </div>
              </form>

              <form action={deleteStaffMember} className="mt-4">
                <input type="hidden" name="id" value={member.id} />
                <button className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100">
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </form>
            </div>
          ))}

          {staffMembers.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
              Aucun membre enregistré pour le moment.
            </div>
          ) : null}
        </section>
      </div>
    </Container>
  );
}
