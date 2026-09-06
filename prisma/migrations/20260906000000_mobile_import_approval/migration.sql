-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "openingDate" TIMESTAMP(3),
ADD COLUMN     "openingEvidence" TEXT,
ADD COLUMN     "openingJournalId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "bookingId" TEXT;

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "csv" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "uploadedById" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLine" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sourceRow" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "categoryId" TEXT,
    "accountId" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'new',
    "replacesId" TEXT,
    "transactionId" TEXT,
    "issue" TEXT,

    CONSTRAINT "ImportLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationNote" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "importBatchId" TEXT,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'note',
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "resolution" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "importBatchId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalTransfer" (
    "id" TEXT NOT NULL,
    "fromAccountId" TEXT NOT NULL,
    "toAccountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_fileHash_key" ON "ImportBatch"("fileHash");

-- CreateIndex
CREATE INDEX "ImportBatch_status_createdAt_idx" ON "ImportBatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportLine_batchId_idx" ON "ImportLine"("batchId");

-- CreateIndex
CREATE INDEX "ImportLine_fingerprint_idx" ON "ImportLine"("fingerprint");

-- CreateIndex
CREATE INDEX "OperationNote_authorId_createdAt_idx" ON "OperationNote"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_transactionId_idx" ON "Evidence"("transactionId");

-- CreateIndex
CREATE INDEX "Evidence_importBatchId_idx" ON "Evidence"("importBatchId");

-- CreateIndex
CREATE INDEX "InternalTransfer_tanggal_idx" ON "InternalTransfer"("tanggal");

-- AddForeignKey
ALTER TABLE "ImportLine" ADD CONSTRAINT "ImportLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

