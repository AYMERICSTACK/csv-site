-- V19.16.1 — Harmonisation visuelle des noms du staff en « NOM Prénom ».
-- This data migration only normalizes known current team-staff spellings. It
-- does not change roles, team links, schedules, favorites or plateaux.

UPDATE "TeamStaffMember"
SET name = CASE name
  WHEN 'Meline Duverger' THEN 'DUVERGER Meline'
  WHEN 'Romain Pernod' THEN 'PERNOD Romain'
  WHEN 'Anthony Bernard' THEN 'BERNARD Anthony'
  WHEN 'Mathieu Macherey' THEN 'MACHEREY Mathieu'
  WHEN 'Pont Pierre' THEN 'PONT Pierre'
  WHEN 'Dargon Rémy' THEN 'DARGON Rémy'
  WHEN 'Dargon Remy' THEN 'DARGON Remy'
  WHEN 'Josselin GREFFERAT' THEN 'GREFFERAT Josselin'
  WHEN 'Josselin Grefferat' THEN 'GREFFERAT Josselin'
  WHEN 'Gregory Martinez' THEN 'MARTINEZ Gregory'
  WHEN 'Julien THERESY' THEN 'THERESY Julien'
  WHEN 'Mathis FROMENT' THEN 'FROMENT Mathis'
  WHEN 'JOLY Mathieu' THEN 'JOLY Mathieu'
  WHEN 'Grenier lilian' THEN 'GRENIER Lilian'
  WHEN 'Louis Costa' THEN 'COSTA Louis'
  WHEN 'Mick Arfaoui' THEN 'ARFAOUI Mick'
  WHEN 'Bernard Burtier' THEN 'BURTIER Bernard'
  WHEN 'Bastien Chanel' THEN 'CHANEL Bastien'
  WHEN 'Vanessa Muffat Jeandet' THEN 'MUFFAT JEANDET Vanessa'
  WHEN 'RODAK Gerald' THEN 'RODAK Gerald'
  WHEN 'Gerald Rodak' THEN 'RODAK Gerald'
  WHEN 'Foukahi Zaki' THEN 'FOUKAHI Zaki'
  WHEN 'Cyril Dupuis' THEN 'DUPUIS Cyril'
  ELSE name
END,
"updatedAt" = NOW()
WHERE name IN (
  'Meline Duverger', 'Romain Pernod', 'Anthony Bernard', 'Mathieu Macherey',
  'Pont Pierre', 'Dargon Rémy', 'Dargon Remy', 'Josselin GREFFERAT',
  'Josselin Grefferat', 'Gregory Martinez', 'Julien THERESY', 'Mathis FROMENT',
  'JOLY Mathieu', 'Grenier lilian', 'Louis Costa', 'Mick Arfaoui',
  'Bernard Burtier', 'Bastien Chanel', 'Vanessa Muffat Jeandet', 'RODAK Gerald',
  'Gerald Rodak', 'Foukahi Zaki', 'Cyril Dupuis'
);

-- Keep the legacy Team.coach fallback consistent on every surface too.
UPDATE "Team"
SET coach = CASE coach
  WHEN 'Meline Duverger' THEN 'DUVERGER Meline'
  WHEN 'Romain Pernod' THEN 'PERNOD Romain'
  WHEN 'Anthony Bernard' THEN 'BERNARD Anthony'
  WHEN 'Mathieu Macherey' THEN 'MACHEREY Mathieu'
  WHEN 'Pont Pierre' THEN 'PONT Pierre'
  WHEN 'Dargon Rémy' THEN 'DARGON Rémy'
  WHEN 'Dargon Remy' THEN 'DARGON Remy'
  WHEN 'Josselin GREFFERAT' THEN 'GREFFERAT Josselin'
  WHEN 'Josselin Grefferat' THEN 'GREFFERAT Josselin'
  WHEN 'Gregory Martinez' THEN 'MARTINEZ Gregory'
  WHEN 'Julien THERESY' THEN 'THERESY Julien'
  WHEN 'Mathis FROMENT' THEN 'FROMENT Mathis'
  WHEN 'JOLY Mathieu' THEN 'JOLY Mathieu'
  WHEN 'Grenier lilian' THEN 'GRENIER Lilian'
  WHEN 'Louis Costa' THEN 'COSTA Louis'
  WHEN 'Mick Arfaoui' THEN 'ARFAOUI Mick'
  WHEN 'Bernard Burtier' THEN 'BURTIER Bernard'
  WHEN 'Bastien Chanel' THEN 'CHANEL Bastien'
  WHEN 'Vanessa Muffat Jeandet' THEN 'MUFFAT JEANDET Vanessa'
  WHEN 'RODAK Gerald' THEN 'RODAK Gerald'
  WHEN 'Gerald Rodak' THEN 'RODAK Gerald'
  WHEN 'Foukahi Zaki' THEN 'FOUKAHI Zaki'
  WHEN 'Cyril Dupuis' THEN 'DUPUIS Cyril'
  ELSE coach
END,
"updatedAt" = NOW()
WHERE coach IN (
  'Meline Duverger', 'Romain Pernod', 'Anthony Bernard', 'Mathieu Macherey',
  'Pont Pierre', 'Dargon Rémy', 'Dargon Remy', 'Josselin GREFFERAT',
  'Josselin Grefferat', 'Gregory Martinez', 'Julien THERESY', 'Mathis FROMENT',
  'JOLY Mathieu', 'Grenier lilian', 'Louis Costa', 'Mick Arfaoui',
  'Bernard Burtier', 'Bastien Chanel', 'Vanessa Muffat Jeandet', 'RODAK Gerald',
  'Gerald Rodak', 'Foukahi Zaki', 'Cyril Dupuis'
);
