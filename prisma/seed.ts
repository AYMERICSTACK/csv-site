import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const commissions = [
    {
      name: "Bureau",
      slug: "bureau",
      description:
        "Coordination générale du club, organisation et suivi des actions transversales.",
      isPublished: true,
      showMembers: true,
      showEmail: true,
      showPhone: false,
    },
    {
      name: "Communication",
      slug: "communication",
      description:
        "Gestion des publications, des visuels, des actualités et de la communication interne/externe du club.",
      isPublished: true,
      showMembers: true,
      showEmail: true,
      showPhone: false,
    },
    {
      name: "Buvette",
      slug: "buvette",
      description:
        "Organisation et gestion de la buvette lors des matchs, tournois et événements du club.",
      isPublished: true,
      showMembers: true,
      showEmail: false,
      showPhone: false,
    },
    {
      name: "Sponsoring",
      slug: "sponsoring",
      description:
        "Recherche de partenaires, suivi des sponsors et mise en valeur des soutiens du club.",
      isPublished: true,
      showMembers: true,
      showEmail: true,
      showPhone: false,
    },
    {
      name: "Matériel",
      slug: "materiel",
      description:
        "Gestion du matériel du club, des équipements et du suivi logistique.",
      isPublished: true,
      showMembers: true,
      showEmail: false,
      showPhone: false,
    },
    {
      name: "Festivités",
      slug: "festivites",
      description:
        "Organisation des événements conviviaux, animations et temps forts du club.",
      isPublished: true,
      showMembers: true,
      showEmail: false,
      showPhone: false,
    },
    {
      name: "Éducateurs",
      slug: "educateurs",
      description:
        "Encadrement sportif, suivi des équipes et coordination technique des éducateurs.",
      isPublished: true,
      showMembers: true,
      showEmail: true,
      showPhone: false,
    },
  ];

  for (const commission of commissions) {
    await prisma.commission.upsert({
      where: { slug: commission.slug },
      update: {
        name: commission.name,
        description: commission.description,
        isPublished: commission.isPublished,
        showMembers: commission.showMembers,
        showEmail: commission.showEmail,
        showPhone: commission.showPhone,
      },
      create: commission,
    });
  }

  console.log("✅ Commissions créées / mises à jour");
}

main()
  .catch((error) => {
    console.error("❌ Erreur seed commissions :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
