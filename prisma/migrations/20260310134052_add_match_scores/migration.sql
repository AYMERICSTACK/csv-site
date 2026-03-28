-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "scoreOpponent" INTEGER,
ADD COLUMN     "scoreTeam" INTEGER,
ALTER COLUMN "status" DROP DEFAULT;
