import { prisma } from "@/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      commissionId: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      commissionId: true,
      role: true,
    },
  });

  if (users.length === 0) {
    console.log("Aucun user avec commissionId à migrer.");
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.commissionId) {
      skipped++;
      continue;
    }

    const existingMembership = await prisma.commissionMembership.findUnique({
      where: {
        userId_commissionId: {
          userId: user.id,
          commissionId: user.commissionId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMembership) {
      console.log(`⏭️ Déjà existant : ${user.email}`);
      skipped++;
      continue;
    }

    await prisma.commissionMembership.create({
      data: {
        userId: user.id,
        commissionId: user.commissionId,
        isAdmin: user.role === "admin",
      },
    });

    console.log(
      `✅ Membership créée : ${user.email} -> ${user.commissionId}${user.role === "admin" ? " (admin)" : ""}`,
    );

    created++;
  }

  console.log("\n=== RÉCAP ===");
  console.log(`Créées : ${created}`);
  console.log(`Ignorées : ${skipped}`);
}

main()
  .catch((error) => {
    console.error("Erreur backfill commission memberships :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
