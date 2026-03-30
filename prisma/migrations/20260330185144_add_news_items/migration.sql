-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "type" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "fileUrl" TEXT,
    "externalUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_slug_key" ON "NewsItem"("slug");

-- CreateIndex
CREATE INDEX "NewsItem_type_isPublished_publishedAt_idx" ON "NewsItem"("type", "isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "NewsItem_sortOrder_idx" ON "NewsItem"("sortOrder");
