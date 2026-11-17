"use server"

import { Role, Status, OrderStatus, DispatchStatus } from "@/app/generated/prisma/enums"
import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";
import { requireAdmin } from "../auth/action";
import * as argon from 'argon2';
import { zodError } from "@/app/libs/zod-error";
import { createDriverSchema, manageDriverSchema, updateVendorSchema } from "./schema";

// 1. Returns current admin's ID for socket room joining
export async function getAdminInfo() {
    try {
        const { adminId } = await requireAdmin();
        return { success: true as const, data: { adminId } };
    } catch (error) {
        return handleActionError(error);
    }
}

// 2. Returns all orders that failed search rounds or were dropped by a driver
export async function getOrdersNeedingAdmin() {
    try {
        const { adminId } = await requireAdmin();
        const orders = await prisma.orderItem.findMany({
            where: {
                dispatchStatus: DispatchStatus.NEEDS_ADMIN,
                product: {
                    storeProducts: {
                        vendor: {
                            adminId: adminId,
                        },
                    },
                },
            },
            include: {
                product: {
                    include: {
                        storeProducts: {
                            include: {
                                address: true,
                            },
                        },
                    },
                },
                order: {
                    include: {
                        customer: {
                            include: {
                                address: true,
                            },
                        },
                    },
                },
            },
            orderBy: { id: "desc" },
        });

        return { success: true as const, data: orders };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getVendors(){
    try {
        const { companyId,adminId } = await requireAdmin();
        const vendors = await prisma.user.findMany({
            where : {
                companyId,
                adminId,
                Role : Role.VENDOR
            }
        })
        if(vendors.length<1){
            return {
                success : false,
                message : "No vendors found"
            }
        }
        return {
            success : true,
            message : "Vendors found",
            data : vendors
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getPendingVendors(){
    try {
        const  { companyId,adminId } = await requireAdmin();
        const res = await prisma.user.findMany({
            where : {
                companyId,
                adminId,
                status : Status.PENDING
            }
        })
        return {
            success : true,
            message : "Pending vendors",
            data : res
        }
    } catch (error:any) {
        return handleActionError(error);
    }
}

export async function approveVendor(id:string){
    try {
        const { adminId , companyId } = await requireAdmin();

        await prisma.user.update({
            where : {
                id,
                adminId,
                companyId
            },
            data : {
                status : Status.ACCEPTED
            }
        })

        return {
            success : true,
            message : "Approved vendor"
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function rejectVendor(id:string){
    try {
        const { adminId , companyId } = await requireAdmin();

        await prisma.user.update({
            where : {
                id,
                adminId,
                companyId
            },
            data : {
                status : Status.REJECTED
            }
        })

        return {
            success : true,
            message : "Rejected vendor"
        }
    } catch (error) {
        return handleActionError(error);
    }
}


export async function updateVendor(body : unknown){
    const res = updateVendorSchema.safeParse(body);
    if(!res.success) return zodError(res.error)
    const { id , ban , status } = res.data;

    try {

        const { companyId } = await requireAdmin();

        await prisma.user.update({
            where : {
                id,
                companyId
            },
            data : {
                ban,
                status
            }
        })
        return {
            success : true,
            message : "Vendor updated successfully"
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function createDriver(body: unknown){
    const res = createDriverSchema.safeParse(body);
    if(!res.success) return zodError(res.error)
    const { name,phone,aadhar,pan,email,password,ban,addressDesc,pin_code,lat,long } = res.data;
    try {
        const { companyId,adminId } = await requireAdmin();

        const hashedPass = await argon.hash(password);

        await prisma.user.create({
            data : {
                name,
                phone,
                aadhar,
                pan,
                ban,
                email,
                companyId,
                Role : Role.DRIVER,
                adminDriverId:adminId,
                password : hashedPass,
                address : {
                    create : {
                        address : addressDesc,
                        pin_code,
                        lat,
                        long
                    }
                }
            }
        })

        return {
            success : true,
            message : "Create driver successfully"
        }
    }
    catch (error) {
        return handleActionError(error);
    }
}

export async function getDrivers(){
    try {
        const { companyId,adminId } = await requireAdmin();

        const drivers = await prisma.user.findMany({
            where : {
                companyId,
                adminDriverId:adminId,
                Role : Role.DRIVER
            }
        })
        if(drivers.length<1){
            return {
                success : false as const,
                message : "Driver details not available",
            }
        }
        return {
            success : true as const,
            message : "Company driver",
            data : drivers
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function selectedDriver(id:string) {
    try {
        const { companyId } = await requireAdmin();
        const res = await prisma.user.findFirst({
            where : {
                companyId,
                id,
                Role:Role.DRIVER
            }
        })
        if(!res){
            return {
                success : false,
                message : "Error occured while fetching driver."
            }
        }
        return {
            success : true,
            message : "Selected driver details",
            data : res
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function manageDriver(body:unknown){
    const res = manageDriverSchema.safeParse(body);
    if(!res.success) return zodError(res.error);
    const { id , ban } = res.data;

    try {
        await requireAdmin();

        const updateDriver = await prisma.user.update({
            where : {
                id,
            },
            data : {
                ban
            }
        })
        if(!updateDriver){
            return {
                success : false,
                message : "Unable to update driver"
            }
        }
        return {
            success : true,
            message : "Driver updated"
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getAdmins(companyId:string){
    try {
        const users = await prisma.user.findMany({
            where : {
                companyId,
                Role : Role.ADMIN
            }
        })
        if(users.length<1){
            return {
                success : false,
                message : "Company admin details not availabe",
            }
        }
        return {
            success : true,
            message : "Company Admins",
            data : users
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getAdminAnalytics() {
  try {
    const { adminId } = await requireAdmin();

    const [
      totalVendors,
      activeVendors,
      pendingVendors,
      totalDrivers,
      activeDrivers,
      totalCustomers,
      totalOrders,
      allOrderItems,
    ] = await Promise.all([
      prisma.user.count({ where: { Role: Role.VENDOR } }),
      prisma.user.count({ where: { Role: Role.VENDOR, status: Status.ACCEPTED } }),
      prisma.user.count({ where: { Role: Role.VENDOR, status: Status.PENDING } }),
      prisma.user.count({ where: { Role: Role.DRIVER } }),
      prisma.user.count({ where: { Role: Role.DRIVER, status: Status.ACCEPTED } }),
      prisma.user.count({ where: { Role: Role.CUSTOMER } }),
      prisma.order.count(),
      prisma.orderItem.findMany({
        select: {
          id: true,
          price: true,
          quantity: true,
          orderStatus: true,
          dispatchStatus: true,
        },
      }),
    ]);

    const totalUsers = totalVendors + totalDrivers + totalCustomers;

    const totalIncome = allOrderItems
      .filter((i) => i.orderStatus === OrderStatus.DELIVERED)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    const pipelineIncome = allOrderItems
      .filter((i) => i.orderStatus !== OrderStatus.CANCELLED)
      .reduce((sum, i) => sum + i.price * i.quantity, 0);

    const deliveredOrders = allOrderItems.filter(
      (i) => i.orderStatus === OrderStatus.DELIVERED
    ).length;
    const activeOrders = allOrderItems.filter(
      (i) =>
        i.orderStatus !== OrderStatus.DELIVERED &&
        i.orderStatus !== OrderStatus.CANCELLED
    ).length;
    const needsAdminOrders = allOrderItems.filter(
      (i) => i.dispatchStatus === DispatchStatus.NEEDS_ADMIN
    ).length;

    const fulfillmentRate =
      allOrderItems.length > 0
        ? Math.round((deliveredOrders / allOrderItems.length) * 100)
        : 0;

    const statusCounts = {
      PLACED: allOrderItems.filter((i) => i.orderStatus === OrderStatus.PLACED).length,
      VENDOR_ACCEPTED: allOrderItems.filter(
        (i) => i.orderStatus === OrderStatus.VENDOR_ACCEPTED
      ).length,
      READY: allOrderItems.filter((i) => i.orderStatus === OrderStatus.READY).length,
      OUT_OF_DELIVERY: allOrderItems.filter(
        (i) => i.orderStatus === OrderStatus.OUT_OF_DELIVERY
      ).length,
      DELIVERED: deliveredOrders,
      CANCELLED: allOrderItems.filter(
        (i) => i.orderStatus === OrderStatus.CANCELLED
      ).length,
    };

    return {
      success: true as const,
      message: "Fetched admin platform analytics successfully",
      data: {
        totalIncome,
        pipelineIncome,
        totalVendors,
        activeVendors,
        pendingVendors,
        totalDrivers,
        activeDrivers,
        totalCustomers,
        totalUsers,
        totalOrders,
        totalOrderItems: allOrderItems.length,
        deliveredOrders,
        activeOrders,
        needsAdminOrders,
        fulfillmentRate,
        statusCounts,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}