import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userEmail = "admin@csv.local";
  const commissionSlug = "bureau";

  const commission = await prisma.commission.findUnique({
    where: { slug: commissionSlug },
  });

  if (!commission) {
    throw new Error(`Commission introuvable: ${commissionSlug}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error(`Utilisateur introuvable: ${userEmail}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      commissionId: commission.id,
    },
  });

  console.log(
    `✅ Utilisateur ${user.email} rattaché à la commission ${commission.name}`,
  );
}

main()
  .catch((error) => {
    console.error("❌ Erreur liaison user/commission :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
