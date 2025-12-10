-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "template" VARCHAR(50),
ADD COLUMN     "type" VARCHAR(50),
ALTER COLUMN "endDate" DROP NOT NULL;
