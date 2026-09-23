-- CreateTable
CREATE TABLE "Certificate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "certType" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_folio_key" ON "Certificate"("folio");
