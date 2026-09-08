CREATE TABLE "FffMatchdaySnapshot" (
"id" TEXT NOT NULL, "sourceUrl" TEXT NOT NULL, "team" TEXT NOT NULL,
"season" INTEGER NOT NULL, "competitionId" INTEGER NOT NULL, "phase" INTEGER NOT NULL,
"poule" INTEGER NOT NULL, "dayNumber" INTEGER NOT NULL, "dayDate" TIMESTAMP(3) NOT NULL,
"totalMatches" INTEGER NOT NULL, "resultCount" INTEGER NOT NULL,
"complete" BOOLEAN NOT NULL DEFAULT false, "matches" JSONB NOT NULL,
"checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"completedAt" TIMESTAMP(3), "rankingSyncedAt" TIMESTAMP(3),
"rankingSyncUserId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "FffMatchdaySnapshot_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "FffMatchdaySnapshot_sourceUrl_season_dayNumber_key" ON "FffMatchdaySnapshot"("sourceUrl","season","dayNumber");
CREATE INDEX "FffMatchdaySnapshot_team_season_dayNumber_idx" ON "FffMatchdaySnapshot"("team","season","dayNumber");
