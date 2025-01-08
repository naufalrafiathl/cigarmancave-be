-- CreateIndex
CREATE INDEX "Brand_name_idx" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Cigar_brandId_name_idx" ON "Cigar"("brandId", "name");

-- CreateIndex
CREATE INDEX "Cigar_name_idx" ON "Cigar"("name");
