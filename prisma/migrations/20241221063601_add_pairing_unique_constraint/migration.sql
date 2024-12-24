/*
  Warnings:

  - A unique constraint covering the columns `[name,type]` on the table `Pairing` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pairing_name_type_key" ON "Pairing"("name", "type");
