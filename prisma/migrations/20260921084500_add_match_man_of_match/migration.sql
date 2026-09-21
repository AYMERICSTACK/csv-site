-- V19.19 — Homme du match pour les Seniors 1 et Seniors 2.
ALTER TABLE "Match" ADD COLUMN "manOfMatchPlayerId" TEXT;

CREATE INDEX "Match_manOfMatchPlayerId_idx" ON "Match"("manOfMatchPlayerId");

ALTER TABLE "Match"
ADD CONSTRAINT "Match_manOfMatchPlayerId_fkey"
FOREIGN KEY ("manOfMatchPlayerId") REFERENCES "Player"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
