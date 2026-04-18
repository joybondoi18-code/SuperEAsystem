-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "binanceApiKey" TEXT,
ADD COLUMN     "binanceSecretKey" TEXT;

-- CreateTable
CREATE TABLE "user_bot_mapping" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "mt5_login" TEXT NOT NULL,
    "mt5_server" TEXT NOT NULL,
    "mt5_broker" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bot_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_bot_mapping_email_key" ON "user_bot_mapping"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_bot_mapping_mt5_login_key" ON "user_bot_mapping"("mt5_login");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
