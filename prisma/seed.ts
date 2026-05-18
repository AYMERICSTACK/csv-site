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
    {
      name: "Licence",
      slug: "licence",
      description:
        "Gestion des licences, dossiers joueurs et démarches administratives liées aux inscriptions.",
      isPublished: true,
      showMembers: true,
      showEmail: false,
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

  await prisma.registrationSettings.upsert({
    where: { id: "default-registration-settings" },
    update: {
      seasonLabel: "Saison 2026/2027",
      introTitle: "S’inscrire au CS Viriat (CSV)",
      introText:
        "Retrouvez ici les informations officielles pour l’inscription : étapes, documents, contacts et informations pratiques.",
      periodText: "juin → septembre",
      contactEmail: "csviriat-football@orange.fr",
      helloAssoUrl: "https://www.helloasso.com/associations/club-sportif-de-viriat/adhesions/licences-2026-2027-csv-football",
      cardPaymentUrl: null,
    },
    create: {
      id: "default-registration-settings",
      seasonLabel: "Saison 2026/2027",
      introTitle: "S’inscrire au CS Viriat (CSV)",
      introText:
        "Retrouvez ici les informations officielles pour l’inscription : étapes, documents, contacts et informations pratiques.",
      periodText: "juin → septembre",
      contactEmail: "csviriat-football@orange.fr",
      helloAssoUrl: "https://www.helloasso.com/associations/club-sportif-de-viriat/adhesions/licences-2026-2027-csv-football",
      cardPaymentUrl: null,
    },
  });

  const fees = [
    { category: "U7 (2020/2021)", fee: "150 €", tombola: "Short + chaussettes inclus", sortOrder: 1 },
    { category: "U9 (2018/2019)", fee: "150 €", tombola: "Short + chaussettes inclus", sortOrder: 2 },
    { category: "U11 (2016/2017)", fee: "175 €", tombola: "Short + chaussettes inclus", sortOrder: 3 },
    { category: "U13 (2014/2015)", fee: "175 €", tombola: "Short + chaussettes inclus", sortOrder: 4 },
    { category: "U15 (2012/2013)", fee: "185 €", tombola: "Short + chaussettes inclus", sortOrder: 5 },
    { category: "U17 (2010/2011)", fee: "205 €", tombola: "Short + chaussettes inclus", sortOrder: 6 },
    { category: "Féminines (née avant 2009)", fee: "170 €", tombola: "Short + chaussettes inclus", sortOrder: 7 },
    { category: "U20 – Seniors (né avant 2009)", fee: "220 €", tombola: "Short + chaussettes inclus", sortOrder: 8 },
    { category: "Vétérans (né avant 1991)", fee: "130 €", tombola: "Short + chaussettes inclus", sortOrder: 9 },
  ];

  for (const fee of fees) {
    await prisma.registrationFee.upsert({
      where: { id: `fee-${fee.sortOrder}` },
      update: fee,
      create: {
        id: `fee-${fee.sortOrder}`,
        ...fee,
      },
    });
  }

  const documents = [
    {
      name: "Tarifs licences 2026/2027",
      status: "Disponible",
      fileUrl: "/inscriptions/tarifs-licences-2026-2027.pdf",
      sortOrder: 1,
    },
    {
      name: "Fiche d’inscription (PDF)",
      status: "À venir",
      fileUrl: null,
      sortOrder: 2,
    },
    {
      name: "Règlement intérieur (PDF)",
      status: "À venir",
      fileUrl: null,
      sortOrder: 3,
    },
    {
      name: "Autorisation photo (PDF)",
      status: "À venir",
      fileUrl: null,
      sortOrder: 4,
    },
    {
      name: "Certificat médical (PDF)",
      status: "Disponible",
      fileUrl: "/certificat_medical_2025_2026.pdf",
      sortOrder: 5,
    },
  ];

  for (const document of documents) {
    await prisma.registrationDocument.upsert({
      where: { id: `document-${document.sortOrder}` },
      update: document,
      create: {
        id: `document-${document.sortOrder}`,
        ...document,
      },
    });
  }

  console.log("✅ Commissions + inscriptions créées / mises à jour");
}

main()
  .catch((error) => {
    console.error("❌ Erreur seed commissions :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
