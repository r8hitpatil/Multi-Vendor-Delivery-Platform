import 'dotenv/config';
import { Job, Worker } from "bullmq";
import { AdminSearchTimeoutJobData, DELIVERY_JOBS, DELIVERY_QUEUES, DriverRoundTimeoutJobData, NotificationJobData, VendorTimeoutJobData } from "../libs/queue/queue.constants";
import { DispatchStatus, OrderStatus, Role, Status } from "../generated/prisma/enums";
import { prisma } from "../libs/prisma";
import { queuePushNotification, scheduleDriverRoundTimeout } from "../libs/queue/delivery.queue";
import { redisConnection } from "../libs/queue/redis";
import { getAdminMessaging } from '../libs/firebase-admin';
import { getDistanceInKm } from "../../distance";

type LiveDriver = { driverId: string; lat: number; long: number };

async function getLiveDrivers(adminId: string): Promise<LiveDriver[]> {
    try {
        const res = await fetch(`http://localhost:3002/live-drivers/${adminId}`, {
            cache: "no-store",
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

// Dispatch worker : Handles order timeouts , driver rounds , admin alerts

export const dispatchWorker = new Worker(
    DELIVERY_QUEUES.DISPATCH,
    async(job:Job) => {
        console.log(`[Worker] Processing Job : ${job.name} (ID: ${job.id})`);

        switch (job.name) {

            // Case 1 : Vendor timeout

            case DELIVERY_JOBS.VENDOR_RESPONSE_TIMEOUT : {
                const { orderId } = job.data as VendorTimeoutJobData;
                const order = await prisma.orderItem.findUnique(
                    {
                        where : {
                            id : orderId
                        },
                        include : {
                            order : {
                                select : {
                                    customerId : true,
                                }
                            }
                        }
                    }
                );

                if(order && order.orderStatus === "PLACED") {
                    await prisma.orderItem.update({
                        where : {
                            id : orderId
                        },
                        data : {
                            orderStatus : OrderStatus.CANCELLED,
                            dispatchStatus : DispatchStatus.NOT_STARTED
                        }
                    })

                    await queuePushNotification({
                        userId : order.order.customerId,
                        title : 'Order cancelled',
                        body : 'Vendor was unable to accept your order in time.',
                    })

                    console.log(`[Worker] order ${orderId} auto-cancelled due to vendor timeout.`);
                }
                break;
            }

            // Case 2 : Driver search round timeout (Rounds 2, 3, and Expiration)
            case DELIVERY_JOBS.DRIVER_ROUND_TIMEOUT : {
                const { orderId, roundNumber, radiusKm } = job.data as DriverRoundTimeoutJobData;
                
                // 1. Check current order status
                const order = await prisma.orderItem.findUnique({
                    where : {
                        id : orderId,
                    },
                    include : {
                        product : {
                            select : {
                                storeId : true,
                            }
                        }
                    }
                });

                if(!order){
                    console.warn(`[Worker] Order ${orderId} not found. Skipping round.`);
                    return;
                }

                // If already accepted or assigned, stop further rounds
                if(
                    order.dispatchStatus === DispatchStatus.ASSIGNED ||
                    order.dispatchStatus === DispatchStatus.MANUALLY_ASSIGNED
                ) {
                    console.log(`[Worker] Order ${orderId} is already assigned. Skipping Round ${roundNumber}.`);
                    return;
                }

                // 2. Fetch Store location and Admin driver list (excluding busy drivers)
                const storeAddress = await prisma.store.findUnique({
                    where : {
                        id : order.product.storeId
                    },
                    include : {
                        address : {
                            select : {
                                lat : true,
                                long : true
                            }
                        },
                        vendor : {
                            select : {
                                adminId : true,
                                range : true,
                                admin : {
                                    select : {
                                        id : true,
                                        range : true,
                                        drivers : {
                                            where : {
                                                Role : Role.DRIVER,
                                                status : Status.ACCEPTED,
                                                ban : false,
                                                driverOrders : {
                                                    none : {
                                                        dispatchStatus : {
                                                            in : [DispatchStatus.ASSIGNED, DispatchStatus.MANUALLY_ASSIGNED],
                                                        },
                                                        orderStatus : {
                                                            notIn : [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
                                                        }
                                                    }
                                                }
                                            },
                                            select : {
                                                id : true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                });

                if(!storeAddress || !storeAddress.address?.lat || !storeAddress.address?.long){
                    throw new Error(`Store or coordinates not found for order ${orderId}`);
                }

                const adminId = storeAddress.vendor.adminId;
                const totalRange = storeAddress.vendor.admin?.range ? Number(storeAddress.vendor.admin.range) : 15;
                const stepRange = Math.round(totalRange / 3);

                // 3. If Round 3 just timed out, escalate to Admin!
                if(roundNumber >= 3) {
                    console.log(`[Worker] All 3 rounds expired for Order ${orderId}. Escalate to Admin.`);
                    await prisma.orderItem.update({
                        where : {
                            id : orderId
                        },
                        data : {
                            dispatchStatus : DispatchStatus.NEEDS_ADMIN
                        }
                    });

                    // Trigger real-time Urgent Modal on Admin Dashboard via socket
                    if (adminId) {
                        await fetch("http://localhost:3002/admin-alert", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                adminId,
                                orderId,
                                message: `Order #${orderId.slice(0, 8)} needs manual assignment (3 driver rounds expired)!`
                            })
                        }).catch(() => {});
                    }
                    break;
                }

                // 4. If order is still SEARCHING, execute Round 2 or Round 3
                if(order.dispatchStatus === DispatchStatus.SEARCHING) {
                    const nextRound = roundNumber + 1;
                    const nextKms = Math.min(radiusKm + stepRange, totalRange);

                    console.log(`[Worker] Round ${roundNumber} expired for Order ${orderId}. Starting Round ${nextRound} with ${nextKms}km radius.`);

                    // Query online drivers from Socket server
                    const liveDrivers = adminId ? await getLiveDrivers(adminId) : [];
                    const validDriverIds = new Set((storeAddress.vendor.admin?.drivers || []).map((d) => d.id));

                    const storeLat = Number(storeAddress.address.lat);
                    const storeLong = Number(storeAddress.address.long);

                    const nearbyDrivers = liveDrivers
                        .filter((d) => validDriverIds.has(d.driverId) && d.lat != null && d.long != null)
                        .map((d) => ({
                            driverId: d.driverId,
                            distanceInKm: getDistanceInKm(storeLat, storeLong, d.lat, d.long)
                        }))
                        .filter((d) => d.distanceInKm <= nextKms)
                        .sort((a, b) => a.distanceInKm - b.distanceInKm);

                    // 5. Push notification to the drivers found in this round!
                    if (nearbyDrivers.length > 0) {
                        console.log(`[Worker] Round ${nextRound}: Found ${nearbyDrivers.length} drivers within ${nextKms}km. Sending notifications...`);
                        
                        for (const driver of nearbyDrivers) {
                            await queuePushNotification({
                                userId: driver.driverId,
                                title: `Delivery Request (Round ${nextRound})`,
                                body: `Order #${orderId.slice(0, 8)} at (${driver.distanceInKm.toFixed(1)} km away). Tap to accept!`,
                                data: {
                                    orderId: orderId,
                                    round: String(nextRound),
                                    type: "NEW_DELIVERY_OFFER",
                                }
                            });
                        }
                    } else {
                        console.log(`[Worker] Round ${nextRound}: No online drivers found within ${nextKms}km.`);
                    }

                    // 6. Schedule timeout for this new round (e.g. 30 seconds delay)
                    await scheduleDriverRoundTimeout(orderId, nextRound, nextKms, 30);
                }
                break;
            }

            // Case 3 : Total search timeout -> Admin alert
            case DELIVERY_JOBS.ADMIN_SEARCH_TIMEOUT : {
                const { orderId } = job.data as AdminSearchTimeoutJobData;
                const order = await prisma.orderItem.findUnique({
                    where : {
                        id : orderId
                    }
                })

                if(order && order.dispatchStatus !== 'ASSIGNED') {
                    await prisma.orderItem.update({
                        where : {
                            id : orderId
                        },
                        data :{ 
                            dispatchStatus:DispatchStatus.NEEDS_ADMIN
                        }
                    })

                    console.warn(`[ALERT] Order ${orderId} has no driver! Status changed to NEED_ADMIN`);
                }
                break;
            }

            default : 
            console.warn(`[Worker] unknown job name : ${job.name}`);
        }
    }, {
        connection : redisConnection,
        concurrency : 5,
        lockDuration : 300000
    }
);

export const notificationWorker = new Worker(
    DELIVERY_QUEUES.NOTIFICATIONS,
    async (job:Job<NotificationJobData>) => {
        const { userId,title,body,data } = job.data;
        console.log(`[Notification worker] Sending push to user ${userId} : ${title}`);

        const user = await prisma.user.findUnique({
            where : {
                id : userId
            },
            select : {
                fcmToken : true,
            },
        });

        if(!user || !user.fcmToken) {
            console.warn(`[Notification worker] user ${userId} has no active FCM token. Skipping push`);
            return;
        }
        
        try {
            const response = await getAdminMessaging().send({
                token: user.fcmToken,
                notification : {
                    title,
                    body,
                },
                data : data || {},
                webpush : {
                    headers : {
                        Urgency : "high",
                    },
                    notification : {
                        title,
                        body,
                        icon : '/file.svg',
                        requireInteraction : true,
                    },
                    fcmOptions : {
                        link : "/dashboard/driver",
                    },
                },
            });
            console.log(`[Notification token] Push delivery : ${response}`);
        } catch (error:any) {
            console.error(`[Notification worker] failed to push notification ${userId} : `,error.message);

            if (
              error.code === "messaging/registration-token-not-registered" ||
              error.code === "messaging/invalid-argument"
            ) {
              console.warn(`[Notification Worker] Token expired or invalid. Removing fcmToken for user ${userId}`);
              await prisma.user.update({
                where: { id: userId },
                data: { fcmToken: null },
              });
            } else {
              throw error;
            }
        }
    }
    ,{
        connection : redisConnection,
        concurrency: 10,
    }
)

dispatchWorker.on('completed', (job) => {
    console.log(`[Worker] Job completed: ${job.name} (ID: ${job.id})`);
});

dispatchWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job FAILED: ${job?.name} (ID: ${job?.id}) - Error:`, err.message);
});