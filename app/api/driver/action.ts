'use server'
import { DispatchStatus, Role } from "@/app/generated/prisma/enums";
import { getSession } from "@/app/libs/auth"
import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";

export async function getDriverAdmin(){
    try {
        const session = await getSession();
        if(!session){
            return {
                success : false as const,
                message : "Missing session"
            }
        }
        const getAdmin = await prisma.user.findUnique({
            where : {
                id : session?.userId
            },
            select : {
                adminDriverId : true as const
            }
        })
        if(!getAdmin || !getAdmin.adminDriverId){
            return {
                success : false as const,
                message : "Missing admin"
            }
        }
        return {
            success : true as const,
            message : "Admin fetched",
            data : {
                driverId : session.userId,
                adminId : getAdmin.adminDriverId
            }
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function saveDriverFcmToken(fcmToken: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== Role.DRIVER) {
            return {
                success: false as const,
                message: "Unauthorized",
            };
        }

        const trimmed = fcmToken.trim();
        if (!trimmed) {
            return {
                success: false as const,
                message: "Invalid FCM token",
            };
        }

        await prisma.user.update({
            where: { id: session.userId },
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
        const session = await getSession();
        if(!session || session.role !== Role.DRIVER) {
            return { success : false as const, message : "Unauthorized" };
        }

        const result = await prisma.orderItem.updateMany({
            where : {
                id : orderItemId,
                dispatchStatus : DispatchStatus.SEARCHING,
                driverId : null,
            },
            data : {
                dispatchStatus : DispatchStatus.ASSIGNED,
                driverId : session.userId
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