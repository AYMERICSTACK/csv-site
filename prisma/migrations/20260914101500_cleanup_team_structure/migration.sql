-- V19.16 — Consolidation de la structure des équipes 2026/2027.
-- Data-only migration: preserve useful staff/schedules/favorites/plateaux while
-- removing obsolete generic teams and restoring the official category layout.

-- Fail fast if the expected production rows are not present. This avoids
-- applying the cleanup against an unexpected dataset.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmtwpspnp0001l604bxddsb8o') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmtwpss22000dl604x18dadnk') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmtwpsr360007l604hazzwisn') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmtwpst0q000jl6045ect18nz') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmpgn0wwa0003j3gsejh25u97') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'team_u13') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmtzkvy5s0001lb044c6wjag7') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmsu8apa20003jw047bvs5uj2') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmtsmifky000hl8045vwhhclc') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmtuas3vn000nl504luek6q1i') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmsu8ang60001jw049ixp8qfp') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'cmpgn0eti0001j3gso8530qql') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'team_seniors_f') OR
     NOT EXISTS (SELECT 1 FROM "Team" WHERE id = 'team_veterans') THEN
    RAISE EXCEPTION 'V19.16 team cleanup aborted: expected team rows are missing.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- ÉCOLE DE FOOT
-- U7 / U9 remain unchanged.
-- U11 1..4 share the same current training slots and U11 responsibility.
-- ---------------------------------------------------------------------------

UPDATE "Team"
SET coach = 'Anthony Bernard', "updatedAt" = NOW()
WHERE id IN (
  'cmtwpspnp0001l604bxddsb8o',
  'cmtwpss22000dl604x18dadnk',
  'cmtwpsr360007l604hazzwisn',
  'cmtwpst0q000jl6045ect18nz'
);

INSERT INTO "TeamStaffMember" (id, role, name, "sortOrder", "createdAt", "updatedAt", "teamId")
VALUES
  ('v1916_u11_1_anthony', 'Responsable U11', 'Anthony Bernard', 0, NOW(), NOW(), 'cmtwpspnp0001l604bxddsb8o'),
  ('v1916_u11_2_anthony', 'Responsable U11', 'Anthony Bernard', 0, NOW(), NOW(), 'cmtwpss22000dl604x18dadnk'),
  ('v1916_u11_3_anthony', 'Responsable U11', 'Anthony Bernard', 0, NOW(), NOW(), 'cmtwpsr360007l604hazzwisn'),
  ('v1916_u11_4_anthony', 'Responsable U11', 'Anthony Bernard', 0, NOW(), NOW(), 'cmtwpst0q000jl6045ect18nz');

INSERT INTO "TeamSchedule" (id, day, time, "sortOrder", "createdAt", "updatedAt", "teamId")
VALUES
  ('v1916_u11_1_wed', 'Mercredi', '17h30 - 19h00', 1, NOW(), NOW(), 'cmtwpspnp0001l604bxddsb8o'),
  ('v1916_u11_1_fri', 'Vendredi', '17h30 - 19h00', 2, NOW(), NOW(), 'cmtwpspnp0001l604bxddsb8o'),
  ('v1916_u11_2_wed', 'Mercredi', '17h30 - 19h00', 1, NOW(), NOW(), 'cmtwpss22000dl604x18dadnk'),
  ('v1916_u11_2_fri', 'Vendredi', '17h30 - 19h00', 2, NOW(), NOW(), 'cmtwpss22000dl604x18dadnk'),
  ('v1916_u11_3_wed', 'Mercredi', '17h30 - 19h00', 1, NOW(), NOW(), 'cmtwpsr360007l604hazzwisn'),
  ('v1916_u11_3_fri', 'Vendredi', '17h30 - 19h00', 2, NOW(), NOW(), 'cmtwpsr360007l604hazzwisn'),
  ('v1916_u11_4_wed', 'Mercredi', '17h30 - 19h00', 1, NOW(), NOW(), 'cmtwpst0q000jl6045ect18nz'),
  ('v1916_u11_4_fri', 'Vendredi', '17h30 - 19h00', 2, NOW(), NOW(), 'cmtwpst0q000jl6045ect18nz');

-- Old generic U11 has no favorites/plateaux. Its staff/schedules can now cascade.
DELETE FROM "Team" WHERE id = 'team_u11';

-- ---------------------------------------------------------------------------
-- FORMATION / JEUNES COMPÉTITION
-- Official mapping confirmed by the club:
-- U13 1 = Josselin GREFFERAT
-- U13 2 = Gregory MARTINEZ
-- U13 3 = Julien THERESY
-- ---------------------------------------------------------------------------

UPDATE "Team"
SET category = 'U13 1', coach = 'Josselin GREFFERAT', "groupId" = 'tg_jeunes_competition', "updatedAt" = NOW()
WHERE id = 'cmpgn0wwa0003j3gsejh25u97';

UPDATE "TeamStaffMember"
SET name = 'Josselin GREFFERAT', "updatedAt" = NOW()
WHERE "teamId" = 'cmpgn0wwa0003j3gsejh25u97';

UPDATE "Team"
SET category = 'U13 2', coach = 'Gregory Martinez', "groupId" = 'tg_jeunes_competition', "updatedAt" = NOW()
WHERE id = 'team_u13';

UPDATE "Team"
SET category = 'U13 3', coach = 'Julien THERESY', "groupId" = 'tg_jeunes_competition', "updatedAt" = NOW()
WHERE id = 'cmtzkvy5s0001lb044c6wjag7';

-- U15 1 and U15 2 are the canonical current teams.
UPDATE "Team"
SET "groupId" = 'tg_jeunes_competition', "updatedAt" = NOW()
WHERE id = 'cmtsmifky000hl8045vwhhclc';

-- U20 belongs to Formation as well.
UPDATE "Team"
SET "groupId" = 'tg_jeunes_competition', "updatedAt" = NOW()
WHERE id = 'cmsu8ang60001jw049ixp8qfp';

-- Old generic U15 rows have no favorites/plateaux. Their schedules are either
-- obsolete or duplicated by the canonical U15 1 / U15 2 rows.
DELETE FROM "Team"
WHERE id IN ('team_u15', 'cmtzkxnnr0001ii040elgli9m');

-- Old U18 becomes the current U17 schedule. U17 staff is already complete.
UPDATE "TeamSchedule"
SET "teamId" = 'cmtuas3vn000nl504luek6q1i', "updatedAt" = NOW()
WHERE "teamId" = 'team_u18';

DELETE FROM "Team" WHERE id = 'team_u18';

-- ---------------------------------------------------------------------------
-- SENIORS
-- ---------------------------------------------------------------------------

-- The old generic Seniors row only carries the useful training slots.
UPDATE "TeamSchedule"
SET "teamId" = 'cmpgn0eti0001j3gso8530qql', "updatedAt" = NOW()
WHERE "teamId" = 'team_seniors';

DELETE FROM "Team" WHERE id = 'team_seniors';

-- Keep the existing women's team data, only use the official category label.
UPDATE "Team"
SET category = 'Féminines', "updatedAt" = NOW()
WHERE id = 'team_seniors_f';

-- ---------------------------------------------------------------------------
-- Stable display order in each group.
-- ---------------------------------------------------------------------------

UPDATE "Team" SET "sortOrder" = 1, "updatedAt" = NOW() WHERE id = 'team_u7';
UPDATE "Team" SET "sortOrder" = 2, "updatedAt" = NOW() WHERE id = 'team_u9';
UPDATE "Team" SET "sortOrder" = 3, "updatedAt" = NOW() WHERE id = 'cmtwpspnp0001l604bxddsb8o';
UPDATE "Team" SET "sortOrder" = 4, "updatedAt" = NOW() WHERE id = 'cmtwpss22000dl604x18dadnk';
UPDATE "Team" SET "sortOrder" = 5, "updatedAt" = NOW() WHERE id = 'cmtwpsr360007l604hazzwisn';
UPDATE "Team" SET "sortOrder" = 6, "updatedAt" = NOW() WHERE id = 'cmtwpst0q000jl6045ect18nz';

UPDATE "Team" SET "sortOrder" = 1, "updatedAt" = NOW() WHERE id = 'cmpgn0wwa0003j3gsejh25u97';
UPDATE "Team" SET "sortOrder" = 2, "updatedAt" = NOW() WHERE id = 'team_u13';
UPDATE "Team" SET "sortOrder" = 3, "updatedAt" = NOW() WHERE id = 'cmtzkvy5s0001lb044c6wjag7';
UPDATE "Team" SET "sortOrder" = 4, "updatedAt" = NOW() WHERE id = 'cmsu8apa20003jw047bvs5uj2';
UPDATE "Team" SET "sortOrder" = 5, "updatedAt" = NOW() WHERE id = 'cmtsmifky000hl8045vwhhclc';
UPDATE "Team" SET "sortOrder" = 6, "updatedAt" = NOW() WHERE id = 'cmtuas3vn000nl504luek6q1i';
UPDATE "Team" SET "sortOrder" = 7, "updatedAt" = NOW() WHERE id = 'cmsu8ang60001jw049ixp8qfp';

UPDATE "Team" SET "sortOrder" = 1, "updatedAt" = NOW() WHERE id = 'cmpgn0eti0001j3gso8530qql';
UPDATE "Team" SET "sortOrder" = 2, "updatedAt" = NOW() WHERE id = 'cmpgol5jf0005j3gsri2znivx';
UPDATE "Team" SET "sortOrder" = 3, "updatedAt" = NOW() WHERE id = 'cmtvjbzm20001i704758p9cwu';
UPDATE "Team" SET "sortOrder" = 4, "updatedAt" = NOW() WHERE id = 'cmtrool6r0001jp04h2nymdrt';
UPDATE "Team" SET "sortOrder" = 5, "updatedAt" = NOW() WHERE id = 'team_seniors_f';
UPDATE "Team" SET "sortOrder" = 6, "updatedAt" = NOW() WHERE id = 'team_veterans';
