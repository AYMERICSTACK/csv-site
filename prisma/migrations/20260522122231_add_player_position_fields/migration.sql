-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "position" TEXT,
ADD COLUMN     "positionSide" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
