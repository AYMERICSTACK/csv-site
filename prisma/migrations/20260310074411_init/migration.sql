-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "matchDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "isHome" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);
