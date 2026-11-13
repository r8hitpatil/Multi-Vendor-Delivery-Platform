import 'dotenv/config';
import { Job, Worker } from "bullmq";
import { AdminSearchTimeoutJobData, DELIVERY_JOBS, DELIVERY_QUEUES, DriverRoundTimeoutJobData, NotificationJobData, VendorTimeoutJobData } from "../libs/queue/queue.constants";
import { DispatchStatus, OrderStatus, Role, Status } from "../generated/prisma/enums";
import { prisma } from "../libs/prisma";
import { queuePushNotification, scheduleDriverRoundTimeout } from "../libs/queue/delivery.queue";
import { redisConnection } from "../libs/queue/redis";
import { getAdminMessaging } from '../libs/firebase-admin';

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

            // Case 2 : Driver search timeout

            case DELIVERY_JOBS.DRIVER_ROUND_TIMEOUT : {
                const { orderId,roundNumber,radiusKm } = job.data as DriverRoundTimeoutJobData;
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
                })
                if(!order){
                    throw new Error('No relevant order found');
                }
                if(order.dispatchStatus === DispatchStatus.ASSIGNED) {
                    console.log(`[Worker] Order ${orderId} is already assigned. Skipping Round ${roundNumber}.`);
                    return;
                }
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
                                range : true,
                                admin : {
                                    select : {
                                        drivers : {
                                            where : {
                                                Role : Role.DRIVER,
                                                status : Status.ACCEPTED,
                                                ban : false,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                })
                if(!storeAddress || !storeAddress.address){
                    throw new Error('Store address not found');
                }

                if(roundNumber >= 3) {
                    await prisma.orderItem.update({
                        where : {
                            id : orderId
                        },
                        data : {
                            dispatchStatus : DispatchStatus.NEEDS_ADMIN
                        }
                    })
                    break;
                }
                if(order.dispatchStatus === DispatchStatus.SEARCHING) {
                    const addRange= Math.round(Number(storeAddress.vendor.range)/3);
                    const nextKms = radiusKm + addRange;
                    const nextRound = roundNumber + 1; // making it round iterate
                    console.log(`[Worker] Round ${roundNumber} expired for Order ${orderId}. Starting Round ${nextRound} with ${nextKms}km radius.`);

                    // Schedule round 2 for 60 seconds
                    await scheduleDriverRoundTimeout(orderId,nextRound,nextKms,10);
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