import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import TeamForm from "@/components/TeamForm";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ScheduleForForm = {
  day: string;
  time: string;
};

function parseSchedules(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      let day = "";
      let time = "";

      if (line.includes("|")) {
        [day, time] = line.split("|").map((part) => part.trim());
      } else {
        const parts = line.split(" ").filter(Boolean);
        day = parts[0] || "";
        time = parts.slice(1).join(" ").trim();
      }

      if (!day || !time) {
        throw new Error(
          `Ligne ${index + 1} incorrecte. Exemple attendu : Mercredi|16h00 – 17h00`,
        );
      }

      return {
        day,
        time,
        sortOrder: index + 1,
      };
    });
}

export default async function EditEquipePage({ params }: PageProps) {
  await requireRole(["admin", "educateurs"]);
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      group: true,
      schedules: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!team) {
    redirect("/espace-educateurs/equipes");
  }

  const groups = await prisma.teamGroup.findMany({
    orderBy: {
      sortOrder: "asc",
    },
  });

  async function updateTeam(formData: FormData) {
    "use server";

    await requireRole(["admin", "educateurs"]);

    const id = String(formData.get("id") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const coach = String(formData.get("coach") || "").trim();
    const groupId = String(formData.get("groupId") || "").trim();
    const sortOrderValue = String(formData.get("sortOrder") || "0").trim();
    const isPublishedValue = String(
      formData.get("isPublished") || "false",
    ).trim();
    const schedulesValue = String(formData.get("schedules") || "").trim();

    if (!id) {
      throw new Error("ID équipe manquant.");
    }

    if (!category) {
      throw new Error("La catégorie est obligatoire.");
    }

    if (!coach) {
      throw new Error("Le responsable est obligatoire.");
    }

    if (!groupId) {
      throw new Error("Le groupe est obligatoire.");
    }

    const existingTeam = await prisma.team.findUnique({
      where: { id },
    });

    if (!existingTeam) {
      throw new Error("Équipe introuvable.");
    }

    const existingGroup = await prisma.teamGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      throw new Error("Le groupe sélectionné est introuvable.");
    }

    const parsedSortOrder = Number(sortOrderValue);
    const sortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0;

    const parsedSchedules = schedulesValue
      ? parseSchedules(schedulesValue)
      : [];

    await prisma.team.update({
      where: { id },
      data: {
        category,
        coach,
        groupId,
        sortOrder,
        isPublished: isPublishedValue === "true",
      },
    });

    await prisma.teamSchedule.deleteMany({
      where: { teamId: id },
    });

    if (parsedSchedules.length > 0) {
      await prisma.teamSchedule.createMany({
        data: parsedSchedules.map((slot) => ({
          teamId: id,
          day: slot.day,
          time: slot.time,
          sortOrder: slot.sortOrder,
        })),
      });
    }

    revalidatePath("/equipes");
    revalidatePath("/espace-educateurs");
    revalidatePath("/espace-educateurs/equipes");
    revalidatePath(`/espace-educateurs/equipes/${id}/edit`);

    redirect("/espace-educateurs/equipes");
  }

  const schedulesForForm: ScheduleForForm[] = team.schedules.map((slot) => ({
    day: slot.day,
    time: slot.time,
  }));

  return (
    <Container>
      <div className="py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/espace-club"
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Espace club
              </Link>

              <Link
                href="/espace-educateurs"
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Commission éducateurs
              </Link>

              <Link
                href="/espace-educateurs/equipes"
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Gestion des équipes
              </Link>

              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700">
                Édition
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Modifier une équipe
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Mets à jour les informations de l’équipe, son responsable, son
              groupe et ses créneaux.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <TeamForm
            mode="edit"
            action={updateTeam}
            groups={groups}
            defaultValues={{
              id: team.id,
              category: team.category,
              coach: team.coach,
              groupId: team.groupId,
              sortOrder: team.sortOrder,
              isPublished: team.isPublished,
              schedules: schedulesForForm,
            }}
          />

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-neutral-900">
                Aperçu actuel
              </h2>

              <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-extrabold text-neutral-900">
                      {team.category}
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      Responsable :{" "}
                      <span className="font-semibold text-neutral-800">
                        {team.coach}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-neutral-600">
                      Groupe :{" "}
                      <span className="font-semibold text-neutral-800">
                        {team.group.title}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      team.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {team.isPublished ? "Publié" : "Masqué"}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {team.schedules.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-500">
                      Aucun créneau
                    </div>
                  ) : (
                    team.schedules.map((slot) => (
                      <div
                        key={slot.id}
                        className="rounded-2xl border border-neutral-200 bg-white px-4 py-3"
                      >
                        <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                          {slot.day}
                        </div>
                        <div className="mt-1 text-sm font-extrabold text-neutral-900">
                          {slot.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm">
              <p>
                <span className="font-semibold text-neutral-900">Astuce :</span>{" "}
                une ligne = un créneau. Tu peux saisir naturellement sans la
                barre verticale, le système essaie de comprendre le format.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
