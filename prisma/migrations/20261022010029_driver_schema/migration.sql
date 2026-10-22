-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminIdDriverId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_adminIdDriverId_fkey" FOREIGN KEY ("adminIdDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
