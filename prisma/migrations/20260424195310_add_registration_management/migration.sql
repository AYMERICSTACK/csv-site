-- CreateTable
CREATE TABLE "RegistrationSettings" (
    "id" TEXT NOT NULL,
    "seasonLabel" TEXT NOT NULL DEFAULT 'Saison 2026',
    "introTitle" TEXT NOT NULL DEFAULT 'S’inscrire au CS Viriat (CSV)',
    "introText" TEXT NOT NULL,
    "periodText" TEXT NOT NULL DEFAULT 'juin → septembre',
    "contactEmail" TEXT NOT NULL DEFAULT 'csviriat-football@orange.fr',
    "helloAssoUrl" TEXT,
    "cardPaymentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationFee" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fee" TEXT NOT NULL,
    "tombola" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'À venir',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistrationFee_sortOrder_idx" ON "RegistrationFee"("sortOrder");

-- CreateIndex
CREATE INDEX "RegistrationDocument_sortOrder_idx" ON "RegistrationDocument"("sortOrder");
