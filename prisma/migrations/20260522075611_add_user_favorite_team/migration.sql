-- AlterTable
ALTER TABLE "User" ADD COLUMN     "favoriteTeamId" TEXT;

-- CreateIndex
CREATE INDEX "User_favoriteTeamId_idx" ON "User"("favoriteTeamId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_favoriteTeamId_fkey" FOREIGN KEY ("favoriteTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
