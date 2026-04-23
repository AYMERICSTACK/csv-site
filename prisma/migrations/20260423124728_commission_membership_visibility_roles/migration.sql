-- AlterTable
ALTER TABLE "CommissionMembership" ADD COLUMN     "isVisibleInCommission" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "roleLabel" TEXT;
