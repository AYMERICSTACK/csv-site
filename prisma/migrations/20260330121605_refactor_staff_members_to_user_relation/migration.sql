-- 1. Ajouter userId sur StaffMember
ALTER TABLE "StaffMember"
ADD COLUMN "userId" TEXT;

-- 2. Migrer les liens existants depuis User.staffMemberId -> StaffMember.userId
UPDATE "StaffMember" AS s
SET "userId" = u."id"
FROM "User" AS u
WHERE u."staffMemberId" = s."id";

-- 3. Supprimer la contrainte FK sur User.staffMemberId si elle existe
ALTER TABLE "User"
DROP CONSTRAINT IF EXISTS "User_staffMemberId_fkey";

-- 4. Supprimer l'unicité sur staffMemberId si elle existe
DROP INDEX IF EXISTS "User_staffMemberId_key";

-- 5. Supprimer la colonne staffMemberId dans User
ALTER TABLE "User"
DROP COLUMN IF EXISTS "staffMemberId";

-- 6. Créer l'index sur StaffMember.userId
CREATE INDEX "StaffMember_userId_idx" ON "StaffMember"("userId");

-- 7. Ajouter la nouvelle FK StaffMember -> User
ALTER TABLE "StaffMember"
ADD CONSTRAINT "StaffMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
