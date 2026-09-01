ALTER TABLE "Match"
ADD COLUMN "penaltyScoreTeam" INTEGER,
ADD COLUMN "penaltyScoreOpponent" INTEGER,
ADD COLUMN "competitionKey" TEXT NOT NULL DEFAULT 'championship',
ADD COLUMN "competitionLabel" TEXT NOT NULL DEFAULT 'Championnat',
ADD COLUMN "competitionType" TEXT NOT NULL DEFAULT 'league',
ADD COLUMN "roundLabel" TEXT;
