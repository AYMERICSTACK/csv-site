CREATE TABLE "Plateau" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'festival',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Plateau_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlateauParticipant" (
    "id" TEXT NOT NULL,
    "plateauId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlateauParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlateauGame" (
    "id" TEXT NOT NULL,
    "plateauId" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "isHome" BOOLEAN NOT NULL DEFAULT true,
    "scoreTeam" INTEGER,
    "scoreOpponent" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlateauGame_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Plateau_teamId_eventDate_idx" ON "Plateau"("teamId", "eventDate");
CREATE INDEX "Plateau_status_eventDate_idx" ON "Plateau"("status", "eventDate");
CREATE INDEX "PlateauParticipant_plateauId_sortOrder_idx" ON "PlateauParticipant"("plateauId", "sortOrder");
CREATE INDEX "PlateauGame_plateauId_sortOrder_idx" ON "PlateauGame"("plateauId", "sortOrder");

ALTER TABLE "Plateau" ADD CONSTRAINT "Plateau_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlateauParticipant" ADD CONSTRAINT "PlateauParticipant_plateauId_fkey" FOREIGN KEY ("plateauId") REFERENCES "Plateau"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlateauGame" ADD CONSTRAINT "PlateauGame_plateauId_fkey" FOREIGN KEY ("plateauId") REFERENCES "Plateau"("id") ON DELETE CASCADE ON UPDATE CASCADE;
