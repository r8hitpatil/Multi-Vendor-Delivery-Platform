"use server"

import { prisma } from "@/app/libs/prisma";
import { requireVendor } from "../auth/action";
import { handleActionError } from "@/app/libs/errors";
import { createStoreSchema, productBodySchema, updateProductBodySchema } from "./schema";
import { zodError } from "@/app/libs/zod-error";
import { DispatchStatus, OrderStatus } from "@/app/generated/prisma/enums";

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

export async function getVendorAnalytics() {
  try {
    const usr = await requireVendor();
    if (usr.ban) {
      throw new Error("Vendor is banned");
    }
    if (usr.status !== "ACCEPTED") {
      return {
        success: false as const,
        message:
          usr.status === "PENDING"
            ? "Your vendor account is pending admin approval"
            : "Your vendor account is rejected",
      };
    }
    if (!usr.storeId) {
      return {
        success: false as const,
        message: "Store not created yet",
      };
    }

    const store = await prisma.store.findUnique({
      where: { id: usr.storeId },
      include: {
        address: true,
        products: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    const orderItems = await prisma.orderItem.findMany({
      where: {
        product: {
          storeId: usr.storeId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        order: {
          select: {
            id: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const totalOrders = orderItems.length;
    const deliveredOrders = orderItems.filter(
      (i) => i.orderStatus === OrderStatus.DELIVERED
    ).length;
    const activeOrders = orderItems.filter(
      (i) =>
        i.orderStatus !== OrderStatus.DELIVERED &&
        i.orderStatus !== OrderStatus.CANCELLED
    ).length;
    const cancelledOrders = orderItems.filter(
      (i) => i.orderStatus === OrderStatus.CANCELLED
    ).length;

    const totalRevenue = orderItems
      .filter((i) => i.orderStatus === OrderStatus.DELIVERED)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    const pipelineRevenue = orderItems
      .filter((i) => i.orderStatus !== OrderStatus.CANCELLED)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    const totalProducts = store?.products.length || 0;
    const totalStockUnits =
      store?.products.reduce((sum, p) => sum + p.quantity, 0) || 0;
    const fulfillmentRate =
      totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    const statusCounts = {
      PLACED: orderItems.filter((i) => i.orderStatus === OrderStatus.PLACED).length,
      VENDOR_ACCEPTED: orderItems.filter(
        (i) => i.orderStatus === OrderStatus.VENDOR_ACCEPTED
      ).length,
      READY: orderItems.filter((i) => i.orderStatus === OrderStatus.READY).length,
      OUT_OF_DELIVERY: orderItems.filter(
        (i) => i.orderStatus === OrderStatus.OUT_OF_DELIVERY
      ).length,
      DELIVERED: deliveredOrders,
      CANCELLED: cancelledOrders,
    };

    const productSalesMap = new Map<
      string,
      { id: string; name: string; unitsSold: number; revenue: number }
    >();
    for (const item of orderItems) {
      if (item.orderStatus === OrderStatus.DELIVERED) {
        const existing = productSalesMap.get(item.productId) || {
          id: item.productId,
          name: item.product?.name || "Product",
          unitsSold: 0,
          revenue: 0,
        };
        existing.unitsSold += item.quantity;
        existing.revenue += item.price * item.quantity;
        productSalesMap.set(item.productId, existing);
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      success: true as const,
      message: "Fetched vendor analytics successfully",
      data: {
        storeName: store?.address?.storeName || "My Store",
        storeAddress: store?.address?.storeAddress || "",
        totalRevenue,
        pipelineRevenue,
        totalOrders,
        deliveredOrders,
        activeOrders,
        cancelledOrders,
        totalProducts,
        totalStockUnits,
        fulfillmentRate,
        statusCounts,
        topProducts,
        recentOrders: orderItems.slice(0, 5).map((i) => ({
          id: i.id,
          orderId: i.order.id,
          customerName: i.order.customer?.name || "Customer",
          productName: i.product?.name || "Product",
          quantity: i.quantity,
          price: i.price,
          total: i.price * i.quantity,
          orderStatus: i.orderStatus,
          dispatchStatus: i.dispatchStatus,
        })),
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}