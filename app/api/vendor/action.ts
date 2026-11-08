"use server"

import { prisma } from "@/app/libs/prisma";
import { requireVendor } from "../auth/action";
import { handleActionError } from "@/app/libs/errors";
import { createStoreSchema, productBodySchema, updateProductBodySchema } from "./schema";
import { zodError } from "@/app/libs/zod-error";
import { OrderStatus } from "@/app/generated/prisma/enums";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/app/libs/firebase";

export async function createStore(body : unknown){
    const res = createStoreSchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { storeName,storeAddress ,lat,long } = res.data;
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
        if(usr.status!=="ACCEPTED"){
            return {
                success : false,
                message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
                "Your vendor account is rejected"
            }
        }
        if(usr.storeId){
            return {
                success : false,
                message : "You already have a store created"
            }
        }
        await prisma.store.create({
            data : {    
            vendorId : usr.vendorId,
                address : {
                    create : {
                        storeName,
                        storeAddress,
                        lat,
                        long
                    }
                }
            }
        })
        return {
            success : true,
            message : "Created store"
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function createNewProduct(body:unknown){
    const res = productBodySchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { name , quantity , price , discountedPrice } = res.data;
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
        if(usr.status!=="ACCEPTED"){
            return {
                success : false,
                message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
                "Your vendor account is rejected"
            }
        }
        if(!usr.storeId){
            return {
                success : false,
                message : usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending"
            }
        }
        if(discountedPrice !== undefined && discountedPrice !== null && discountedPrice >= price){
            return {
                success : false,
                message : "Discounted price must be less than original price."
            }
        }
        await prisma.product.create({
            data : {
                name,
                quantity,
                storeId : usr.storeId,
                price,
                discountedPrice
            }
        })
        return {
            success : true,
            message : "Created product successfully."
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function updateProduct(body:unknown){
    const res = updateProductBodySchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { id , ...data } = res.data;
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
        if(usr.status!=="ACCEPTED"){
            return {
                success : false,
                message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
                "Your vendor account is rejected"
            }
        }
        if(!usr.storeId){
            return {
                success : false as  const,
                message : usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending"
            }
        }
        const existing = await prisma.product.findUnique({
            where : {
                id,
                storeId : usr.storeId
            }
        })
        if(!existing) {
            return { 
                success : false as const,
                message : "Product not found in your store."
            }
        }

        const effectivePrice = data.price ?? existing.price;
        const effectiveDiscount = data.discountedPrice !== undefined ? data.discountedPrice : existing.discountedPrice;
        if(effectiveDiscount !== undefined && effectiveDiscount !== null && effectiveDiscount >= effectivePrice){
            return {
                success: false as const,
                message: "Discounted price must be less than original price."
            }
        }

        await prisma.product.update({
            where : {
                id
            },
            data
        })
        return {
            success : true as const,
            message : "Product updated successfully."
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getProducts(){
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
        if(usr.status!=="ACCEPTED"){
            return {
                success : false,
                message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
                "Your vendor account is rejected"
            }
        }
        if(!usr.storeId){
            return {
                success : false as  const,
                message : usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending"
            }
        }
        const existing = await prisma.product.findMany({
            where : {
                storeId : usr.storeId
            }
        })
        if(!existing) {
            return { 
                success : false as const,
                message : "Product not found in your store."
            }
        }
        return {
            success : true as const,
            message : "Products from store",
            data : existing
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function deleteProduct(id:string){
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
        if(usr.status!=="ACCEPTED"){
            return {
                success : false,
                message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
                "Your vendor account is rejected"
            }
        }
        if(!usr.storeId){
            return {
                success : false as  const,
                message : usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending"
            }
        }
        const existing = await prisma.product.findFirst({
            where : {
                id,
                storeId : usr.storeId
            }
        })
        if(!existing) {
            return { 
                success : false as const,
                message : "Product not found in your store."
            }
        }
        await prisma.product.delete({
            where : {
                id
            }
        })
        return {
            success : true as const,
            message : "Deleted product successfully"
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getOrderedProducts() {
  try {
    const usr = await requireVendor();
    if (usr.ban) {
      throw new Error("Vendor is banned");
    }
    if(usr.status!=="ACCEPTED"){
        return {
            success : false,
            message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
            "Your vendor account is rejected"
        }
    }
    if (!usr.storeId) {
      return {
        success: false as const,
        message: usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending",
      };
    }
    const orderItems = await prisma.orderItem.findMany({
      where: {
        product: {
          storeId: usr.storeId,
        },
      },
      include: {
        product: { select: { id: true, name: true } },
        order: {
          select: {
            id: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
              },
            },
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
    return {
      success: true as const,
      message: "Orders at the store.",
      data: orderItems,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function changeOrderStatus(id:string,status:OrderStatus){
    try {
        const usr = await requireVendor();
        if (usr.ban) {
          throw new Error("Vendor is banned");
        }
        if(usr.status!=="ACCEPTED"){
            return {
                success : false,
                message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
                "Your vendor account is rejected"
            }
        }
        if (!usr.storeId) {
          return {
            success: false as const,
            message: usr.status === "ACCEPTED" ? "Store id not found" : "Request is pending",
          };
        }

        if(!Object.values(OrderStatus).includes(status)) {
            return {
                success : false as const,
                message : "Invalid order status value"
            }
        }

        const updated = await prisma.orderItem.update({
            where : {
                id,
                product : {
                    storeId : usr.storeId
                }
            },
            data : {
                orderStatus : status
            }
        })
        return {
            success : true as const,
            message : "Changes the order status",
            data : updated
        }
    } catch (error) {
        return handleActionError(error);
    }
}
    
export async function notifyDriverReq(id:string){
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
        if(usr.status!=="ACCEPTED"){
            return {
                success : false,
                message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
                "Your vendor account is rejected"
            }
        }
        const item = await prisma.orderItem.findUnique({
            where : {
                id,
            },
            include : {
                order : {
                    select : {
                        customer : {
                            select : {
                                name : true,
                                address : true
                            }
                        }
                    }
                },
                product : {
                    select : {
                        name : true,
                    }
                },
            }
        })
        if(!item){
            throw new Error("Order item not found");
        }
        if(!item.order.customer.address?.address){
            throw new Error("No address found")
        }
        if(!usr.adminId){
            throw new Error("No admin assigned")
        }
        if(item.driverId){
            return {
                success : false as const,
                message : "A driver is already assigned to this order."
            }
        }

        const existingReq = await getDoc(doc(db, "driver_req", item.id));
        if (existingReq.exists() && existingReq.data()?.status === "PENDING") {
          return {
            success: false as const,
            message: "A driver request is already pending with the admin.",
          };
        }

        await setDoc(doc(db,"driver_req",item.id),{
            adminId : usr.adminId,
            vendorId : usr.vendorId,
            storeId : usr.storeId,
            order : item.order,
            orderId : item.orderId,
            productName : item.product.name,
            customerName : item.order.customer.name,
            deliveryAddress : item.order.customer.address.address,
            status : "PENDING",
            createdAt : serverTimestamp()
        })
        return {
            success : true,
            message : "Driver request was sent in real time."
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getDriverReqStatus(){
    try {
        const usr = await requireVendor();
        if(usr.ban){
            throw new Error("Vendor is banned");
        }
        if(usr.status!=="ACCEPTED"){
            return {
                success : false as const,
                message : usr.status === "PENDING" ? "Your vendor account is pending admin approval" : 
                "Your vendor account is rejected"
            }
        }
        const snapshot = await getDocs(collection(db, "driver_req"));
        const pendingIds = snapshot.docs.map((doc) => doc.id);
        return {
            success : true as const,
            message : "Driver requests docs",
            data : pendingIds
        }
    } catch (error) {
        return handleActionError(error);
    }
}

// function available drivers