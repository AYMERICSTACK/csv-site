-- CreateTable
CREATE TABLE "CommissionMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionMembership_userId_idx" ON "CommissionMembership"("userId");

-- CreateIndex
CREATE INDEX "CommissionMembership_commissionId_idx" ON "CommissionMembership"("commissionId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionMembership_userId_commissionId_key" ON "CommissionMembership"("userId", "commissionId");

-- AddForeignKey
ALTER TABLE "CommissionMembership" ADD CONSTRAINT "CommissionMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionMembership" ADD CONSTRAINT "CommissionMembership_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
