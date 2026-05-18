-- CreateTable
CREATE TABLE "TeamSetting" (
    "id" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "fffUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamSetting_team_key" ON "TeamSetting"("team");
