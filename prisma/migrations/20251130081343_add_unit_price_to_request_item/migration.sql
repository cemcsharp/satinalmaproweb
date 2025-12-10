/*
  Warnings:

  - Added the required column `unitPrice` to the `RequestItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RequestItem" ADD COLUMN     "unitPrice" DECIMAL(18,2) NOT NULL DEFAULT 0;
