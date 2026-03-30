import { prisma } from "@/lib/prisma";
import EquipesClient from "./EquipesClient";

export default async function EquipesPage() {
  const groups = await prisma.teamGroup.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      teams: {
        where: {
          isPublished: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          schedules: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },
  });

  return <EquipesClient groups={groups} />;
}
