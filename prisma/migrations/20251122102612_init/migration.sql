-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "email" VARCHAR(200),
ADD COLUMN     "phone" VARCHAR(50),
ADD COLUMN     "taxOffice" VARCHAR(200);

-- CreateIndex
CREATE INDEX "CAPA_status_idx" ON "CAPA"("status");

-- CreateIndex
CREATE INDEX "CAPA_supplierId_idx" ON "CAPA"("supplierId");

-- CreateIndex
CREATE INDEX "CAPA_openedAt_idx" ON "CAPA"("openedAt");

-- CreateIndex
CREATE INDEX "CAPA_supplierId_status_idx" ON "CAPA"("supplierId", "status");
