-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "overallScore" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Pairing" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Pairing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewPairing" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "pairingId" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ReviewPairing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewPairing_reviewId_idx" ON "ReviewPairing"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewPairing_pairingId_idx" ON "ReviewPairing"("pairingId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewPairing_reviewId_pairingId_key" ON "ReviewPairing"("reviewId", "pairingId");

-- AddForeignKey
ALTER TABLE "ReviewPairing" ADD CONSTRAINT "ReviewPairing_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewPairing" ADD CONSTRAINT "ReviewPairing_pairingId_fkey" FOREIGN KEY ("pairingId") REFERENCES "Pairing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
