/*
  Warnings:

  - You are about to drop the column `nombaReference` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "nombaReference",
ADD COLUMN     "merchantTxRef" TEXT;
