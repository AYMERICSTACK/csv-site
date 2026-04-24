import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function mapSectionToCommissionSlug(sectionTitle?: string | null) {
  const section = sectionTitle?.toLowerCase() || "";

  if (section.includes("bureau")) return "bureau";
  if (section.includes("référent") || section.includes("referent"))
    return "educateurs";
  if (section.includes("technique") || section.includes("sportif"))
    return "educateurs";
  if (section.includes("catég")) return "educateurs";

  return null;
}

function createFallbackEmail(name: string, id: string) {
  const cleanName = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return `${cleanName || "membre"}.${id.slice(0, 6)}@csv.local`;
}

async function main() {
  console.log("🚀 Migration StaffMember → User + CommissionMembership");

  const defaultPasswordHash = await bcrypt.hash("CsvViriat2026!", 10);

  const staffMembers = await prisma.staffMember.findMany({
    orderBy: { name: "asc" },
  });

  console.log(`👥 StaffMembers trouvés : ${staffMembers.length}`);

  let createdUsers = 0;
  let existingUsers = 0;
  let createdMemberships = 0;
  let skippedMemberships = 0;

  for (const staff of staffMembers) {
    const email =
      normalizeEmail(staff.email) || createFallbackEmail(staff.name, staff.id);

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: staff.name,
          email,
          phone: staff.phone || null,
          passwordHash: defaultPasswordHash,
          role: "member",
          isActive: false,
        },
      });

      createdUsers++;
      console.log(`✅ User créé : ${user.name} (${user.email})`);
    } else {
      existingUsers++;
      console.log(
        `ℹ️ User existant : ${user.name || staff.name} (${user.email})`,
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || staff.name,
          phone: user.phone || staff.phone || null,
        },
      });
    }

    const commissionSlug = mapSectionToCommissionSlug(staff.sectionTitle);

    if (!commissionSlug) {
      console.log(
        `⚠️ Pas de commission trouvée pour ${staff.name} — section: ${staff.sectionTitle}`,
      );
      continue;
    }

    const commission = await prisma.commission.findUnique({
      where: { slug: commissionSlug },
    });

    if (!commission) {
      console.log(`❌ Commission introuvable : ${commissionSlug}`);
      continue;
    }

    const existingMembership = await prisma.commissionMembership.findFirst({
      where: {
        userId: user.id,
        commissionId: commission.id,
      },
    });

    if (existingMembership) {
      skippedMemberships++;
      console.log(
        `↩️ Membership déjà existant : ${staff.name} → ${commission.name}`,
      );
      continue;
    }

    await prisma.commissionMembership.create({
      data: {
        userId: user.id,
        commissionId: commission.id,
        roleLabel: staff.roleLabel || null,
        isAdmin: staff.isCommissionAdmin || false,
        isVisibleInCommission: true,
      },
    });

    createdMemberships++;
    console.log(`🔗 Membership créé : ${staff.name} → ${commission.name}`);
  }

  console.log("");
  console.log("✅ Migration terminée");
  console.log("--------------------------------");
  console.log(`Users créés : ${createdUsers}`);
  console.log(`Users déjà existants : ${existingUsers}`);
  console.log(`Memberships créés : ${createdMemberships}`);
  console.log(`Memberships ignorés : ${skippedMemberships}`);
}

main()
  .catch((error) => {
    console.error("❌ Erreur migration :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
