/*
  Warnings:

  - You are about to drop the column `storeId` on the `Address` table. All the data in the column will be lost.
  - Added the required column `price` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Product_name_key";

-- AlterTable
ALTER TABLE "Address" DROP COLUMN "storeId";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountedPrice" INTEGER,
ADD COLUMN     "price" INTEGER NOT NULL;
