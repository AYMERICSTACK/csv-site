import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Container from "@/components/Container";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import TeamForm from "@/components/TeamForm";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

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

export default async function NewEquipePage() {
  await requireRole(["admin", "educateurs"]);

  const groups = await prisma.teamGroup.findMany({
    orderBy: {
      sortOrder: "asc",
    },
  });

  async function createTeam(formData: FormData) {
    "use server";

    await requireRole(["admin", "educateurs"]);

    const category = String(formData.get("category") || "").trim();
    const coach = String(formData.get("coach") || "").trim();
    const groupId = String(formData.get("groupId") || "").trim();
    const sortOrderValue = String(formData.get("sortOrder") || "0").trim();
    const isPublishedValue = String(
      formData.get("isPublished") || "true",
    ).trim();
    const schedulesValue = String(formData.get("schedules") || "").trim();

    if (!category) {
      throw new Error("La catégorie est obligatoire.");
    }

    if (!coach) {
      throw new Error("Le responsable est obligatoire.");
    }

    if (!groupId) {
      throw new Error("Le groupe est obligatoire.");
    }

    const parsedSortOrder = Number(sortOrderValue);
    const sortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0;

    const existingGroup = await prisma.teamGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      throw new Error("Le groupe sélectionné est introuvable.");
    }

    const schedules = schedulesValue ? parseSchedules(schedulesValue) : [];

    const team = await prisma.team.create({
      data: {
        category,
        coach,
        groupId,
        sortOrder,
        isPublished: isPublishedValue === "true",
      },
    });

    if (schedules.length > 0) {
      await prisma.teamSchedule.createMany({
        data: schedules.map((slot) => ({
          teamId: team.id,
          day: slot.day,
          time: slot.time,
          sortOrder: slot.sortOrder,
        })),
      });
    }

    revalidatePath("/equipes");
    revalidatePath("/espace-educateurs");
    revalidatePath("/espace-educateurs/equipes");

    redirect("/espace-educateurs/equipes");
  }

  if (groups.length === 0) {
    return (
      <Container>
        <div className="py-14">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
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

              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
                Création
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-neutral-900 md:text-3xl">
              Impossible d’ajouter une équipe
            </h1>

            <p className="mt-3 max-w-2xl text-neutral-700">
              Aucun groupe n’existe encore. Crée d’abord un groupe avant
              d’ajouter une équipe à la commission éducateurs.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/espace-educateurs/equipes"
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                Retour à la gestion des équipes
              </Link>

              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </Container>
    );
  }

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
                Création
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Ajouter une équipe
            </h1>

            <p className="mt-3 text-base leading-relaxed text-neutral-700 md:text-lg">
              Crée une nouvelle équipe, définis son responsable, son groupe, son
              ordre d’affichage, sa visibilité et ses créneaux.
            </p>
          </div>

          <AdminLogoutButton />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <TeamForm mode="create" action={createTeam} groups={groups} />

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-neutral-900">
                Conseils de saisie
              </h2>

              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <p>
                  <span className="font-semibold text-neutral-900">
                    Catégorie :
                  </span>{" "}
                  utilise un nom simple et clair, par exemple U7, U11, U15F,
                  Seniors 1.
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">
                    Responsable :
                  </span>{" "}
                  indique le nom du référent principal affiché sur la page
                  publique.
                </p>

                <p>
                  <span className="font-semibold text-neutral-900">
                    Créneaux :
                  </span>{" "}
                  une ligne = un créneau. Tu peux saisir naturellement sans la
                  barre verticale, le système essaie de comprendre le format.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm">
              <p>
                <span className="font-semibold text-neutral-900">Astuce :</span>{" "}
                après création, tu pourras encore modifier l’équipe, ajuster son
                ordre et la réorganiser par glisser-déposer depuis le board.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
