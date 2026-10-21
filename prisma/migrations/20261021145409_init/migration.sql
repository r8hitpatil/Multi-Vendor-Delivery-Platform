-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VENDOR', 'DRIVER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('REJECTED', 'PENDING', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('RECIEVED', 'IN_TRANSIT', 'REACHED', 'OUT_OF_DELIVERY', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "Role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "aadhar" TEXT,
    "pan" TEXT,
    "ban" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "companyId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pin_code" INTEGER NOT NULL,
    "lat" TEXT NOT NULL,
    "long" TEXT NOT NULL,
    "userId" TEXT,
    "storeId" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreAddress" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeAddress" TEXT NOT NULL,
    "lat" TEXT NOT NULL,
    "long" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "StoreAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_aadhar_key" ON "User"("aadhar");

-- CreateIndex
CREATE UNIQUE INDEX "User_pan_key" ON "User"("pan");

-- CreateIndex
CREATE UNIQUE INDEX "Company_companyName_key" ON "Company"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "Company_addressId_key" ON "Company"("addressId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_vendorId_key" ON "Store"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreAddress_storeName_key" ON "StoreAddress"("storeName");

-- CreateIndex
CREATE UNIQUE INDEX "StoreAddress_storeAddress_key" ON "StoreAddress"("storeAddress");

-- CreateIndex
CREATE UNIQUE INDEX "StoreAddress_storeId_key" ON "StoreAddress"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreAddress" ADD CONSTRAINT "StoreAddress_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
