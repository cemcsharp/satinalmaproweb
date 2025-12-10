-- AlterTable
ALTER TABLE "CAPA" ADD COLUMN     "approvalStatus" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approverId" TEXT,
ADD COLUMN     "effectivenessMethod" TEXT,
ADD COLUMN     "problemHow" TEXT,
ADD COLUMN     "problemWhen" TIMESTAMP(3),
ADD COLUMN     "problemWhere" TEXT,
ADD COLUMN     "problemWho" TEXT,
ADD COLUMN     "sustainabilityNotes" TEXT,
ADD COLUMN     "verificationResult" TEXT;

-- AddForeignKey
ALTER TABLE "CAPA" ADD CONSTRAINT "CAPA_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
