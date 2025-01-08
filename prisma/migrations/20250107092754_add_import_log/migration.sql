-- CreateTable
CREATE TABLE "ImportLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "processingMethod" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportLog_userId_createdAt_idx" ON "ImportLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportLog_fileType_createdAt_idx" ON "ImportLog"("fileType", "createdAt");

-- AddForeignKey
ALTER TABLE "ImportLog" ADD CONSTRAINT "ImportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
