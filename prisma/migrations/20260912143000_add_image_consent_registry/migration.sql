CREATE TABLE "PlayerImageConsent" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "season" TEXT NOT NULL,
  "isMinor" BOOLEAN,
  "paperStatus" TEXT NOT NULL DEFAULT 'pending',
  "paperReceivedAt" TIMESTAMP(3),
  "digitalStatus" TEXT NOT NULL DEFAULT 'pending',
  "digitalRespondentName" TEXT,
  "digitalRespondentRole" TEXT,
  "digitalRespondentEmail" TEXT,
  "digitalSubmittedAt" TIMESTAMP(3),
  "policyVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlayerImageConsent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImageConsentSubmission" (
  "id" TEXT NOT NULL,
  "playerId" TEXT,
  "season" TEXT NOT NULL,
  "playerFirstName" TEXT NOT NULL,
  "playerLastName" TEXT NOT NULL,
  "team" TEXT NOT NULL,
  "isMinor" BOOLEAN NOT NULL,
  "choice" TEXT NOT NULL,
  "respondentName" TEXT NOT NULL,
  "respondentRole" TEXT NOT NULL,
  "respondentEmail" TEXT,
  "policyVersion" TEXT NOT NULL,
  "policyText" TEXT NOT NULL,
  "matched" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImageConsentSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlayerImageConsent_playerId_season_key" ON "PlayerImageConsent"("playerId", "season");
CREATE INDEX "PlayerImageConsent_season_digitalStatus_idx" ON "PlayerImageConsent"("season", "digitalStatus");
CREATE INDEX "PlayerImageConsent_season_paperStatus_idx" ON "PlayerImageConsent"("season", "paperStatus");
CREATE INDEX "ImageConsentSubmission_season_matched_idx" ON "ImageConsentSubmission"("season", "matched");
CREATE INDEX "ImageConsentSubmission_playerId_createdAt_idx" ON "ImageConsentSubmission"("playerId", "createdAt");

ALTER TABLE "PlayerImageConsent" ADD CONSTRAINT "PlayerImageConsent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImageConsentSubmission" ADD CONSTRAINT "ImageConsentSubmission_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
