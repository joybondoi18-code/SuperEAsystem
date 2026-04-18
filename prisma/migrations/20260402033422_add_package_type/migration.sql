-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('STANDARD', 'PREMIUM');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "packageType" "PackageType";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "packageType" "PackageType",
ADD COLUMN "vpsId" TEXT;