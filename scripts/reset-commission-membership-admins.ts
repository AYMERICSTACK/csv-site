import { prisma } from "@/lib/prisma";

async function main() {
  const result = await prisma.commissionMembership.updateMany({
    data: {
      isAdmin: false,
    },
  });

  console.log(`✅ Memberships remises à isAdmin=false : ${result.count}`);
}

main()
  .catch((error) => {
    console.error("Erreur reset membership admins :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
