ALTER TABLE "FffMatchdaySnapshot"
ADD COLUMN "notificationClaimedAt" TIMESTAMP(3),
ADD COLUMN "notificationSentAt" TIMESTAMP(3),
ADD COLUMN "notificationResendId" TEXT,
ADD COLUMN "notificationLastError" TEXT;
