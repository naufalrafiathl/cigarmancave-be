/*
  Warnings:

  - You are about to drop the column `profleImageUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "profleImageUrl",
ADD COLUMN     "profileImageUrl" TEXT;
