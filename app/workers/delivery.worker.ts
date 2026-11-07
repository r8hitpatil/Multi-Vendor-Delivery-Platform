import { Job, Worker } from "bullmq";
import { AdminSearchTimeoutJobData, DELIVERY_JOBS, DELIVERY_QUEUES, DriverRoundTimeoutJobData, NotificationJobData, VendorTimeoutJobData } from "../libs/queue/queue.constants";
import { DispatchStatus, OrderStatus } from "../generated/prisma/enums";
import { prisma } from "../libs/prisma";
import { queuePushNotification, scheduleDriverRoundTimeout } from "../libs/queue/delivery.queue";
import { redisConnection } from "../libs/queue/redis";

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
                    }
                })

                if(!order || order.dispatchStatus === "ASSIGNED") {
                    console.log(`[Worker] Order ${orderId} is already assigned. Skipping Round ${roundNumber}.`);
                    return;
                }

                // If round 1 is done yet not assigned , we go in round 2
                if(roundNumber === 1) {
                    const nextRadius = 5; // expanding to 5k
                    console.log(`[Worker] Round 1 expired for Order ${orderId}. Starting Round 2 with ${nextRadius}km radius.`);

                    // Schedule round 2 for 60 seconds
                    await scheduleDriverRoundTimeout(orderId,2,nextRadius,60);
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
    }
);

export const notificationWorker = new Worker(
    DELIVERY_QUEUES.NOTIFICATIONS,
    async (job:Job<NotificationJobData>) => {
        const { userId,title,body } = job.data;
        console.log(`[Notification worker] Sending push to user ${userId} : ${title}`);
    }

    //CALL FIREBASE FCM
    ,{
        connection : redisConnection,
        concurrency: 10,
    }
)