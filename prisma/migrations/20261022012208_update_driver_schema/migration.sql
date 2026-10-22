/*
  Warnings:

  - You are about to drop the column `adminIdDriverId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_adminIdDriverId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "adminIdDriverId",
ADD COLUMN     "adminDriverId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_adminDriverId_fkey" FOREIGN KEY ("adminDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
