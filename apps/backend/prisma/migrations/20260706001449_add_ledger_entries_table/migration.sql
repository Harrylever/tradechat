-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "balanceNaira" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amountNaira" DECIMAL(12,2) NOT NULL,
    "balanceBeforeNaira" DECIMAL(12,2) NOT NULL,
    "balanceAfterNaira" DECIMAL(12,2) NOT NULL,
    "transactionId" TEXT,
    "withdrawalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_transactionId_key" ON "LedgerEntry"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_withdrawalId_key" ON "LedgerEntry"("withdrawalId");

-- CreateIndex
CREATE INDEX "LedgerEntry_merchantId_createdAt_idx" ON "LedgerEntry"("merchantId", "createdAt");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "Withdrawal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
