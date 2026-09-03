-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "contactId" TEXT;

-- CreateTable
CREATE TABLE "BankStatement" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "periodeAwal" TIMESTAMP(3) NOT NULL,
    "periodeAkhir" TIMESTAMP(3) NOT NULL,
    "saldoAwal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoAkhir" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "namaFile" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatementLine" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION,
    "refBank" TEXT,
    "status" TEXT NOT NULL DEFAULT 'belum',
    "transactionId" TEXT,
    "skorCocok" DOUBLE PRECISION,

    CONSTRAINT "BankStatementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashClosing" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "shift" TEXT NOT NULL,
    "businessUnitId" TEXT,
    "accountId" TEXT NOT NULL,
    "saldoSistem" DOUBLE PRECISION NOT NULL,
    "saldoFisik" DOUBLE PRECISION NOT NULL,
    "selisih" DOUBLE PRECISION NOT NULL,
    "rincianPecahan" JSONB,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dibuatOlehId" TEXT,
    "disetujuiOlehId" TEXT,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noHp" TEXT,
    "email" TEXT,
    "alamat" TEXT,
    "npwp" TEXT,
    "termin" INTEGER NOT NULL DEFAULT 0,
    "limitKredit" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoice" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jatuhTempo" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "coaBebanKode" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "ppn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pphDipotong" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "terbayar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'belum',
    "businessUnitId" TEXT,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankStatement_accountId_idx" ON "BankStatement"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "BankStatementLine_transactionId_key" ON "BankStatementLine"("transactionId");

-- CreateIndex
CREATE INDEX "BankStatementLine_statementId_idx" ON "BankStatementLine"("statementId");

-- CreateIndex
CREATE INDEX "BankStatementLine_tanggal_idx" ON "BankStatementLine"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "CashClosing_journalEntryId_key" ON "CashClosing"("journalEntryId");

-- CreateIndex
CREATE INDEX "CashClosing_tanggal_idx" ON "CashClosing"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "CashClosing_tanggal_shift_accountId_key" ON "CashClosing"("tanggal", "shift", "accountId");

-- CreateIndex
CREATE INDEX "Contact_tipe_idx" ON "Contact"("tipe");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_nomor_key" ON "PurchaseInvoice"("nomor");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_journalEntryId_key" ON "PurchaseInvoice"("journalEntryId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_jatuhTempo_idx" ON "PurchaseInvoice"("jatuhTempo");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_status_idx" ON "PurchaseInvoice"("status");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatement" ADD CONSTRAINT "BankStatement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "BankStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashClosing" ADD CONSTRAINT "CashClosing_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

