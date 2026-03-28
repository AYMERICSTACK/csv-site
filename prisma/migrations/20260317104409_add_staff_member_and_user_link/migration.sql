/*
  Warnings:

  - A unique constraint covering the columns `[staffMemberId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showEmailToMembers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showPhoneToMembers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "staffMemberId" TEXT;

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleLabel" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "photo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_staffMemberId_key" ON "User"("staffMemberId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
