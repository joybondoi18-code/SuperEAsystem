-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentRef" TEXT;
