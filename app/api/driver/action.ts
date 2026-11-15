'use server'
import { DispatchStatus, OrderStatus } from "@/app/generated/prisma/enums";
import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";
import { requireAdmin, requireDriver } from "../auth/action";
import { queuePushNotification } from "@/app/libs/queue/delivery.queue";
import { success } from "zod";

export async function getDriverAdmin() {
    try {
        const { driverId, adminId } = await requireDriver();
        return {
            success: true as const,
            message: "Successfully fetched driver id and admin id",
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
        const { driverId: id } = await requireDriver();

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

export async function driverAcceptOrder(orderItemId: string) {
    try {
        const { driverId } = await requireDriver();
        const vendorPickupOtp = Math.floor(1000 + Math.random() * 9000);

        const result = await prisma.orderItem.updateMany({
            where: {
                id: orderItemId,
                dispatchStatus: DispatchStatus.SEARCHING,
                driverId: null,
            },
            data : {
                orderStatus : OrderStatus.READY,
                dispatchStatus : DispatchStatus.ASSIGNED,
                driverId,
                otp : vendorPickupOtp,
                wrongAttempts : 0,
                cooldownUntil : null,
            }
        })

        if (result.count === 0) {
            return {
                success: false as const,
                message: "This order was already accepted by other driver",
            };
        }

        return {
            success: true as const,
            message: "Order assigned to you successfully!",
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function getActiveDriverOrders() {
    try {
        const { driverId } = await requireDriver();
        const orders = await prisma.orderItem.findMany({
            where: {
                driverId,
                dispatchStatus: {
                    in: [DispatchStatus.ASSIGNED, DispatchStatus.MANUALLY_ASSIGNED],
                },
                orderStatus: {
                    notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
                },
            },
            include: {
                product: {
                    include: {
                        storeProducts: {
                            include: {
                                address: true,
                            }
                        }
                    }
                },
                order: {
                    include: {
                        customer: {
                            include: {
                                address: true,
                            }
                        }
                    }
                }
            },
            orderBy: { id: 'desc' },
        });

        return { success: true as const, data: orders, message: "Fetched active drivers successfully." };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function updateDriverOrderStatus(orderItemId: string, nextStatus: OrderStatus) {
    try {
        const { driverId } = await requireDriver();
        await prisma.orderItem.updateMany({
            where: {
                id: orderItemId,
                driverId,
            },
            data: {
                orderStatus: nextStatus
            },
        });

        return {
            success: true as const,
            message: `Status updated to ${nextStatus}`
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function cancelDriverOrderStatus(orderItemId: string) {
    try {
        const { driverId, adminId } = await requireDriver();
        await prisma.orderItem.updateMany({
            where: {
                id: orderItemId,
                driverId
            },
            data: {
                orderStatus: OrderStatus.PLACED,
                dispatchStatus: DispatchStatus.NEEDS_ADMIN,
                driverId: null,
                otp : null,
                wrongAttempts : 0,
                cooldownUntil : null,
            },
        });

        if (adminId) {
            await fetch("http://localhost:3002/admin-alert", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({
                    adminId,
                    orderId: orderItemId,
                    message: `Driver cancelled Order ${orderItemId.slice(0, 8)}. Need reassignment!`
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
            success: true as const,
            message: `Order escalated to admin`
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function adminAssignDriverOrder(driverId: string, orderItemId: string) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return {
                success: false as const,
                message: "Admin not found"
            }
        }

        const vendorPickupOtp = Math.floor(1000 + Math.random() * 9000);

        const res = await prisma.orderItem.updateMany({
            where: {
                id: orderItemId,
                driverId: null,
                dispatchStatus: DispatchStatus.NEEDS_ADMIN,
            },
            data: {
                driverId,
                dispatchStatus: DispatchStatus.MANUALLY_ASSIGNED,
                orderStatus : OrderStatus.READY,
                otp : vendorPickupOtp,
                wrongAttempts : 0,
                cooldownUntil : null,
            }
        });

        if (res.count === 0) {
            return {
                success: false as const,
                message: "Order assigned already",
            }
        }

        if (driverId) {
            await fetch("http://localhost:3002/driver-alert", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({
                    orderId: orderItemId,
                    driverId,
                    message: `Assigned #Order${orderItemId.slice(0, 8)} to you.!`
                })
            });

            await queuePushNotification({
                userId: driverId,
                title: "Urgent: Order Assigned",
                body: `Assigned #Order${orderItemId.slice(0, 8)} to you.!`,
                data: {
                    orderId: orderItemId,
                    driverId,
                    type: "ORDER_ASSIGNED_BY_ADMIN",
                },
            });
        }

        return {
            success: true as const,
            message: `Assigned order ${orderItemId} to driver ${driverId}`
        }
    } catch (error) {
        return handleActionError(error);
    }
}

export async function verifyVendorOtp(orderItemId: string, otp: number | string) {
    try {
        const { driverId } = await requireDriver();
        const numericOtp = typeof otp === "string" ? parseInt(otp, 10) : otp;
        if (isNaN(numericOtp) || numericOtp < 1000 || numericOtp > 9999) {
            return { success: false as const, message: "Please enter a valid 4-digit OTP." };
        }

        const verify = await prisma.orderItem.findFirst({
            where: {
                id: orderItemId,
                driverId,
            },
            select: {
                vendorOtp: true,
                wrongAttempts: true,
                cooldownUntil: true,
            }
        });

        if (!verify) {
            return { success: false as const, message: "Order item not found" };
        }

        if (!verify.vendorOtp) {
            return { success: false as const, message: "Vendor pickup OTP has not been generated for this order." };
        }

        const now = new Date();

        // 1. If cooldown is currently active, block the request
        if (verify.cooldownUntil && verify.cooldownUntil > now) {
            const secondsLeft = Math.ceil((verify.cooldownUntil.getTime() - Date.now()) / 1000);
            return {
                success: false as const,
                message: `3 wrong attempts exceeded. Please wait ${secondsLeft}s before trying again.`
            };
        }

        // 2. If 30s cooldown has passed, reset attempts back to 0 (keeps the SAME OTP!)
        if (verify.wrongAttempts >= 3 && verify.cooldownUntil && verify.cooldownUntil <= now) {
            await prisma.orderItem.update({
                where: { id: orderItemId },
                data: {
                    wrongAttempts: 0,
                    cooldownUntil: null,
                }
            });
            verify.wrongAttempts = 0; // Reset local variable for this execution
        }

        // 3. Wrong OTP Check
        if (verify.vendorOtp !== numericOtp) {
            const nextAttempt = verify.wrongAttempts + 1;

            if (nextAttempt >= 3) {
                // 👈 3rd attempt reached: Apply 30-second cooldown lock!
                await prisma.orderItem.update({
                    where: { id: orderItemId },
                    data: {
                        wrongAttempts: nextAttempt,
                        cooldownUntil: new Date(Date.now() + 30 * 1000), // 30s lock
                    }
                });

                return {
                    success: false as const,
                    message: "3 wrong attempts reached! You are locked for 30 seconds."
                };
            }

            // 👈 Attempts 1 & 2: NO cooldown, just increment attempt count
            await prisma.orderItem.update({
                where: { id: orderItemId },
                data: {
                    wrongAttempts: nextAttempt,
                    cooldownUntil: null, // No cooldown
                }
            });

            const remaining = 3 - nextAttempt;
            return {
                success: false as const,
                message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            };
        }

        // 4. Correct OTP (Vendor Handover Success)
        // Advances status to OUT_OF_DELIVERY (Customer OTP is already ready!)
        await prisma.orderItem.update({
            where: { id: orderItemId },
            data: {
                orderStatus: OrderStatus.OUT_OF_DELIVERY,
                wrongAttempts: 0,
                cooldownUntil: null,
            }
        });

        return {
            success: true as const,
            message: `Pickup verified! Order #${orderItemId.slice(0, 8)} is now out for delivery.`
        };
    } catch (error) {
        return handleActionError(error);
    }
}

export async function verifyCustomerOtp(orderItemId: string, otp: number | string) {
    try {
        const { driverId } = await requireDriver();
        const numericOtp = typeof otp === "string" ? parseInt(otp, 10) : otp;
        if (isNaN(numericOtp) || numericOtp < 1000 || numericOtp > 9999) {
            return { success: false as const, message: "Please enter a valid 4-digit OTP." };
        }

        const verify = await prisma.orderItem.findFirst({
            where: {
                id: orderItemId,
                driverId,
            },
            select: {
                customerOtp: true,
                wrongAttempts: true,
                cooldownUntil: true,
            }
        });

        if (!verify) {
            return { success: false as const, message: "Order item not found" };
        }

        if (!verify.customerOtp) {
            return { success: false as const, message: "Customer delivery OTP is missing." };
        }

        const now = new Date();

        // 1. Cooldown check
        if (verify.cooldownUntil && verify.cooldownUntil > now) {
            const secondsLeft = Math.ceil((verify.cooldownUntil.getTime() - Date.now()) / 1000);
            return {
                success: false as const,
                message: `3 wrong attempts exceeded. Please wait ${secondsLeft}s before trying again.`
            };
        }

        // 2. Cooldown expired: Reset attempts back to 0
        if (verify.wrongAttempts >= 3 && verify.cooldownUntil && verify.cooldownUntil <= now) {
            await prisma.orderItem.update({
                where: { id: orderItemId },
                data: {
                    wrongAttempts: 0,
                    cooldownUntil: null,
                }
            });
            verify.wrongAttempts = 0;
        }

        // 3. Wrong OTP
        if (verify.customerOtp !== numericOtp) {
            const nextAttempt = verify.wrongAttempts + 1;

            if (nextAttempt >= 3) {
                await prisma.orderItem.update({
                    where: { id: orderItemId },
                    data: {
                        wrongAttempts: nextAttempt,
                        cooldownUntil: new Date(Date.now() + 30 * 1000), // 30s lock
                    }
                });

                return {
                    success: false as const,
                    message: "3 wrong attempts reached! You are locked for 30 seconds."
                };
            }

            // Attempts 1 & 2: No cooldown
            await prisma.orderItem.update({
                where: { id: orderItemId },
                data: {
                    wrongAttempts: nextAttempt,
                    cooldownUntil: null,
                }
            });

            const remaining = 3 - nextAttempt;
            return {
                success: false as const,
                message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            };
        }

        // 4. Correct OTP: Mark as DELIVERED & clear
        await prisma.orderItem.update({
            where: { id: orderItemId },
            data: {
                orderStatus: OrderStatus.DELIVERED,
                wrongAttempts: 0,
                cooldownUntil: null,
            }
        });

        return {
            success: true as const,
            message: `Delivery completed successfully for Order #${orderItemId.slice(0, 8)}!`
        };
    } catch (error) {
        return handleActionError(error);
    }
}