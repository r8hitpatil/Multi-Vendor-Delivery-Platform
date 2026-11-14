'use server'
import { DispatchStatus, OrderStatus } from "@/app/generated/prisma/enums";
import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";
import { requireAdmin, requireDriver } from "../auth/action";
import { queuePushNotification } from "@/app/libs/queue/delivery.queue";

export async function getDriverAdmin(){
    try {
    const { driverId,adminId } = await requireDriver();
    return {
      success: true as const,
      message : "Successfully fetched driver id and admin id",
      data: {
        driverId,
        adminId,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function saveDriverFcmToken(fcmToken: string) {
    try {
        const { driverId : id } = await requireDriver();

        const trimmed = fcmToken.trim();
        if (!trimmed) {
            return {
                success: false as const,
                message: "Invalid FCM token",
            };
        }

        await prisma.user.update({
            where: { id },
            data: { fcmToken: trimmed },
            select: { id: true },
        });

        return {
            success: true as const,
            message: "FCM token saved",
        };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function driverAcceptOrder(orderItemId : string) {
    try {
        const { driverId } = await requireDriver();

        const result = await prisma.orderItem.updateMany({
            where : {
                id : orderItemId,
                dispatchStatus : DispatchStatus.SEARCHING,
                driverId : null,
            },
            data : {
                dispatchStatus : DispatchStatus.ASSIGNED,
                driverId,
            }
        })

        if(result.count === 0) {
            return {
                success : false as const,
                message : "This order was already accepted by other driver",
            };
        }

        return {
            success : true as const,
            message : "Order assigned to you successfully!",
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getActiveDriverOrders(){
    try {
        const { driverId } = await requireDriver();
        const orders = await prisma.orderItem.findMany({
        where : {
            driverId,
            dispatchStatus : {
                in : [DispatchStatus.ASSIGNED,DispatchStatus.MANUALLY_ASSIGNED],
            },
            orderStatus : {
                notIn : [OrderStatus.DELIVERED,OrderStatus.CANCELLED],
            },
        },
        include : {
            product : {
                include : {
                    storeProducts : {
                        include : {
                            address : true,
                        }
                    }
                }
            },
            order : {
                include : {
                    customer : {
                        include : {
                            address : true,
                        }
                    }
                }
            }
        },
        orderBy : { id : 'desc' },
        });

        return { success : true as const , data : orders , message : "Fetched active drivers successfully."};
    } catch (error) {
        return handleActionError(error);
    }
}

export async function updateDriverOrderStatus(orderItemId: string,nextStatus:OrderStatus){
    try {
        const { driverId } = await requireDriver();
        await prisma.orderItem.updateMany({
            where : {
                id : orderItemId,
                driverId,
            },
            data : {
                orderStatus : nextStatus
            },
        });

        return {
            success : true as const,
            message : `Status updated to ${nextStatus}`
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function cancelDriverOrderStatus(orderItemId: string){
    try {
        const { driverId,adminId } = await requireDriver();
        await prisma.orderItem.updateMany({
            where : {
                id : orderItemId,
                driverId
            },
            data : {
                orderStatus : OrderStatus.PLACED,
                dispatchStatus : DispatchStatus.NEEDS_ADMIN,
                driverId : null,
            },
        });

        if(adminId){
            await fetch("http://localhost:3002/admin-alert",{
                method : "POST",
                headers : { "Content-type" : "application/json" },
                body : JSON.stringify({
                    adminId,
                    orderId : orderItemId,
                    message : `Driver cancelled Order ${orderItemId.slice(0,8)}. Need reassignment!`
                })
            })

            await queuePushNotification({
                userId: adminId,
                title: "Urgent: Order Cancelled",
                body: `Driver cancelled Order #${orderItemId.slice(0, 8)}. Needs reassignment!`,
                data: {
                  orderId: orderItemId,
                  type: "ORDER_CANCELLED_BY_DRIVER",
                },
            });
        }

        return {
            success : true as const,
            message : `Order escalated to admin`
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function adminAssignDriverOrder(driverId:string,orderItemId:string) {
    try {
        const admin = await requireAdmin();
        if(!admin){
            return {
                success : false as const,
                message : "Admin not found"
            }
        }
        
        const res = await prisma.orderItem.updateMany({
            where : {
                id : orderItemId,
                driverId : null,
                dispatchStatus : DispatchStatus.NEEDS_ADMIN,
            },
            data : {
                driverId,
                dispatchStatus : DispatchStatus.MANUALLY_ASSIGNED,
            }
        });

        if(res.count === 0) {
            return {
                success : false as const,
                message : "Order assigned already",
            }
        }

        if(driverId){
            await fetch("http://localhost:3002/driver-alert",{
                method : "POST",
                headers : { "Content-type":"application/json" },
                body : JSON.stringify({
                    orderId : orderItemId,
                    driverId,
                    message : `Assigned #Order${orderItemId.slice(0,8)} to you.!`
                })
            });

            await queuePushNotification({
                userId: driverId,
                title: "Urgent: Order Assigned",
                body: `Assigned #Order${orderItemId.slice(0,8)} to you.!`,
                data: {
                  orderId: orderItemId,
                  driverId,
                  type: "ORDER_ASSIGNED_BY_ADMIN",
                },
            });
        }

        return {
            success : true as const,
            message : `Assigned order ${orderItemId} to driver ${driverId}`
        }
    } catch (error) {
        return handleActionError(error);
    }
}