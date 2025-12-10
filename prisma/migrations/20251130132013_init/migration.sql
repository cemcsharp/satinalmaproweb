/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `SmtpSetting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `SmtpSetting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SmtpSetting" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SmtpSetting_key_key" ON "SmtpSetting"("key");
