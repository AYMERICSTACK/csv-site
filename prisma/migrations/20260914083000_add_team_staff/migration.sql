CREATE TABLE "TeamStaffMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "TeamStaffMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeamStaffMember_teamId_sortOrder_idx" ON "TeamStaffMember"("teamId", "sortOrder");

ALTER TABLE "TeamStaffMember" ADD CONSTRAINT "TeamStaffMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reprend le responsable historique comme premier membre du staff.
INSERT INTO "TeamStaffMember" ("id", "role", "name", "sortOrder", "createdAt", "updatedAt", "teamId")
SELECT 'staff_' || md5(random()::text || clock_timestamp()::text || "id"), 'Entraîneur principal', "coach", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "id"
FROM "Team"
WHERE NULLIF(BTRIM("coach"), '') IS NOT NULL
  AND BTRIM("coach") <> 'À renseigner';
