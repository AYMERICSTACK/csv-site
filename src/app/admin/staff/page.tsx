import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  Layers3,
  Plus,
  Save,
  Trash2,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { auth } from "@/auth";
import Container from "@/components/Container";
import Badge from "@/components/Badge";
import AdminLogoutButton from "@/components/AdminLogoutButton";
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

  const session = await auth();
  const displayName = session?.user?.name || "CS Viriat";
  const roleBadge =
    session?.user?.role === "admin" ? "Administrateur" : "Commission bureau";

  const staffMembers = await prisma.staffMember.findMany({
    orderBy: [{ sectionTitle: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const publishedCount = staffMembers.filter((member) => member.isPublished).length;
  const hiddenCount = staffMembers.length - publishedCount;

  const staffBySection = STAFF_SECTIONS.map((section) => ({
    title: section,
    members: staffMembers.filter((member) => member.sectionTitle === section),
  }));

  const otherMembers = staffMembers.filter(
    (member) => !STAFF_SECTIONS.includes(member.sectionTitle),
  );

  const sectionsToDisplay = otherMembers.length
    ? [...staffBySection, { title: "Autres sections", members: otherMembers }]
    : staffBySection;

  return (
    <Container>
      <div className="py-8 md:py-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-950 px-6 py-8 shadow-sm md:px-8 md:py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
          <div className="absolute -right-16 top-0 h-52 w-52 rounded-full bg-csv-orange/25 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Espace club</Badge>
                <Badge>{roleBadge}</Badge>
                <Badge>Staff & organigramme</Badge>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Bonjour {displayName}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Gérez les membres visibles sur la page publique : bureau,
                responsables, référents et pôle sportif. Les changements sont
                automatiquement répercutés sur l’organigramme public.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/espace-club"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-white hover:text-neutral-950"
              >
                <ArrowLeft className="h-4 w-4" />
                Espace club
              </Link>

              <Link
                href="/club/staff"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-neutral-950 transition hover:bg-csv-orange hover:text-white"
              >
                <Eye className="h-4 w-4" />
                Voir le public
              </Link>

              <AdminLogoutButton />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-neutral-500">Total membres</p>
              <UsersRound className="h-5 w-5 text-orange-500" />
            </div>
            <p className="mt-3 text-3xl font-black text-neutral-950">
              {staffMembers.length}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-neutral-500">Publiés</p>
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-neutral-950">
              {publishedCount}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-neutral-500">Masqués</p>
              <EyeOff className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-neutral-950">
              {hiddenCount}
            </p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-orange-50/50 shadow-sm">
          <div className="border-b border-orange-100 bg-white/70 px-6 py-5 md:px-7">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-neutral-950">
                  Ajouter un membre
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Renseignez seulement les informations utiles, puis choisissez
                  sa section d’affichage.
                </p>
              </div>

              <span className="inline-flex w-fit items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-orange-700">
                Nouveau
              </span>
            </div>
          </div>

          <form action={addStaffMember} className="grid gap-4 p-5 md:p-7 xl:grid-cols-12">
            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-bold text-neutral-900">
                Nom complet <span className="text-orange-600">*</span>
              </label>
              <input
                name="name"
                placeholder="Ex : VALLIER Christophe"
                className="input bg-white"
              />
            </div>

            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-bold text-neutral-900">
                Fonction <span className="text-orange-600">*</span>
              </label>
              <input
                name="roleLabel"
                placeholder="Ex : Président"
                className="input bg-white"
              />
            </div>

            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-bold text-neutral-900">
                Section <span className="text-orange-600">*</span>
              </label>
              <select name="sectionTitle" defaultValue="" className="input bg-white">
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
              <label className="mb-2 block text-sm font-bold text-neutral-900">
                Ordre
              </label>
              <input
                type="number"
                name="sortOrder"
                defaultValue={0}
                className="input bg-white"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-2 block text-sm font-bold text-neutral-900">
                Visibilité
              </label>
              <label className="flex h-[46px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold text-neutral-700 shadow-sm">
                <input
                  type="checkbox"
                  name="isPublished"
                  defaultChecked
                  className="h-4 w-4 accent-orange-500"
                />
                Publié sur le site
              </label>
            </div>

            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-bold text-neutral-900">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="optionnel"
                className="input bg-white"
              />
            </div>

            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-bold text-neutral-900">
                Téléphone
              </label>
              <input name="phone" placeholder="optionnel" className="input bg-white" />
            </div>

            <div className="flex items-end xl:col-span-6">
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-800 md:w-auto">
                <Plus className="h-4 w-4" />
                Ajouter le membre
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 space-y-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-neutral-950">
                Membres par section
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                L’ordre affiché ici correspond à l’ordre de publication sur la
                page publique.
              </p>
            </div>
          </div>

          {sectionsToDisplay.map((section) => (
            <details
              key={section.title}
              open={section.members.length > 0}
              className="group overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer list-none flex-col gap-3 border-b border-neutral-100 bg-neutral-50/80 px-5 py-4 transition hover:bg-orange-50/70 md:flex-row md:items-center md:justify-between md:px-6 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                    <Layers3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-950">
                      {section.title}
                    </h3>
                    <p className="text-sm font-medium text-neutral-500">
                      {section.members.length} membre(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-neutral-600 shadow-sm ring-1 ring-neutral-200">
                    Cliquer pour ouvrir / fermer
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition group-open:rotate-180 group-hover:text-orange-700">
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </div>
              </summary>

              <div className="space-y-4 p-4 md:p-5">
                {section.members.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm font-medium text-neutral-500">
                    Aucun membre dans cette section pour le moment.
                  </div>
                ) : null}

                {section.members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-orange-100 hover:shadow-md md:p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 border-b border-neutral-100 pb-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-black text-neutral-950">
                            {member.name}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                              member.isPublished
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {member.isPublished ? (
                              <Eye className="h-3.5 w-3.5" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                            {member.isPublished ? "Publié" : "Masqué"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-orange-700">
                          {member.roleLabel}
                        </p>
                      </div>

                      <p className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-extrabold text-neutral-600">
                        Ordre {member.sortOrder}
                      </p>
                    </div>

                    <form action={updateStaffMember} className="grid gap-4 xl:grid-cols-12">
                      <input type="hidden" name="id" value={member.id} />

                      <div className="xl:col-span-3">
                        <label className="mb-2 block text-sm font-bold text-neutral-900">
                          Nom complet
                        </label>
                        <input
                          name="name"
                          defaultValue={member.name}
                          className="input"
                        />
                      </div>

                      <div className="xl:col-span-3">
                        <label className="mb-2 block text-sm font-bold text-neutral-900">
                          Fonction
                        </label>
                        <input
                          name="roleLabel"
                          defaultValue={member.roleLabel}
                          className="input"
                        />
                      </div>

                      <div className="xl:col-span-3">
                        <label className="mb-2 block text-sm font-bold text-neutral-900">
                          Section
                        </label>
                        <select
                          name="sectionTitle"
                          defaultValue={member.sectionTitle}
                          className="input"
                        >
                          {STAFF_SECTIONS.map((sectionName) => (
                            <option key={sectionName} value={sectionName}>
                              {sectionName}
                            </option>
                          ))}
                          {!STAFF_SECTIONS.includes(member.sectionTitle) ? (
                            <option value={member.sectionTitle}>{member.sectionTitle}</option>
                          ) : null}
                        </select>
                      </div>

                      <div className="xl:col-span-1">
                        <label className="mb-2 block text-sm font-bold text-neutral-900">
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
                        <label className="mb-2 block text-sm font-bold text-neutral-900">
                          Visibilité
                        </label>
                        <label className="flex h-[46px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold text-neutral-700">
                          <input
                            type="checkbox"
                            name="isPublished"
                            defaultChecked={member.isPublished}
                            className="h-4 w-4 accent-orange-500"
                          />
                          Affiché
                        </label>
                      </div>

                      <div className="xl:col-span-3">
                        <label className="mb-2 block text-sm font-bold text-neutral-900">
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
                        <label className="mb-2 block text-sm font-bold text-neutral-900">
                          Téléphone
                        </label>
                        <input
                          name="phone"
                          defaultValue={member.phone ?? ""}
                          placeholder="optionnel"
                          className="input"
                        />
                      </div>

                      <div className="flex flex-col gap-3 xl:col-span-6 xl:flex-row xl:items-end xl:justify-between">
                        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-neutral-800">
                          <Save className="h-4 w-4" />
                          Enregistrer
                        </button>
                      </div>
                    </form>

                    <form action={deleteStaffMember} className="mt-3 flex justify-end border-t border-neutral-100 pt-3">
                      <input type="hidden" name="id" value={member.id} />
                      <button className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-extrabold text-red-700 transition hover:bg-red-100">
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </section>
      </div>
    </Container>
  );
}
