CREATE TABLE "FffWeekendAdminRecap" (
    "id" TEXT NOT NULL,
    "weekendKey" TEXT NOT NULL,
    "weekendStart" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "resendId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FffWeekendAdminRecap_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FffWeekendAdminRecap_weekendKey_key" ON "FffWeekendAdminRecap"("weekendKey");
CREATE INDEX "FffWeekendAdminRecap_weekendStart_idx" ON "FffWeekendAdminRecap"("weekendStart");
