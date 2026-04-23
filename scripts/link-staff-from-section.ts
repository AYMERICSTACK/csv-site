import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mapSectionToSlug(section: string) {
  const s = normalize(section);

  if (s.includes("bureau")) return "bureau";
  if (s.includes("communication")) return "communication";
  if (s.includes("referent")) return "educateurs";
  if (s.includes("technique")) return "educateurs";
  if (s.includes("sportif")) return "educateurs";
  if (s.includes("categorie")) return "educateurs";

  return null;
}

async function main() {
  const members = await prisma.staffMember.findMany();

  for (const member of members) {
    if (!member.sectionTitle) continue;

    const slug = mapSectionToSlug(member.sectionTitle);

    if (!slug) {
      console.warn(`⚠️ Pas de mapping pour: ${member.sectionTitle}`);
      continue;
    }

    const commission = await prisma.commission.findUnique({
      where: { slug },
    });

    if (!commission) {
      console.warn(`⚠️ Commission introuvable: ${slug}`);
      continue;
    }

    await prisma.staffMember.update({
      where: { id: member.id },
      data: {
        commissionId: commission.id,
      },
    });

    console.log(`✅ ${member.name} → ${commission.name}`);
  }

  console.log("🎯 Liaison terminée");
}

main()
  .catch((error) => {
    console.error("❌ Erreur liaison automatique :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
