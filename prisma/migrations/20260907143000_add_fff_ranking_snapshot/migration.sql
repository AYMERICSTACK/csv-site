CREATE TABLE "FffRankingSnapshot" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "rows" JSONB NOT NULL,
    "found" BOOLEAN NOT NULL DEFAULT false,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "lastSuccessAt" TIMESTAMP(3) NOT NULL,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FffRankingSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FffRankingSnapshot_sourceUrl_key" ON "FffRankingSnapshot"("sourceUrl");
