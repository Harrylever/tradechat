/*
  Warnings:

  - A unique constraint covering the columns `[merchantTxRef]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_merchantTxRef_key" ON "Transaction"("merchantTxRef");

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"("status", "createdAt");
