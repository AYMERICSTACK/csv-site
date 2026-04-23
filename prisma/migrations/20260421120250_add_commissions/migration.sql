-- AlterTable
ALTER TABLE "StaffMember" ADD COLUMN     "commissionId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "commissionId" TEXT;

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "showMembers" BOOLEAN NOT NULL DEFAULT true,
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commission_slug_key" ON "Commission"("slug");

-- CreateIndex
CREATE INDEX "StaffMember_commissionId_idx" ON "StaffMember"("commissionId");

-- CreateIndex
CREATE INDEX "User_commissionId_idx" ON "User"("commissionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
