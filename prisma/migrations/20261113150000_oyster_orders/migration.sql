CREATE TABLE "OysterOrder" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL DEFAULT 34,
    "status" TEXT NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OysterOrder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OysterOrder_createdAt_idx" ON "OysterOrder"("createdAt");
CREATE INDEX "OysterOrder_status_idx" ON "OysterOrder"("status");
