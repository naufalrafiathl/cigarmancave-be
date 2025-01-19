/*
  Warnings:

  - You are about to drop the column `porilfeImageUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "porilfeImageUrl",
ADD COLUMN     "profleImageUrl" TEXT;
