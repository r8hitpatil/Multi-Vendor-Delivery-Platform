import { Queue } from 'bullmq';
import { redisConnection } from './redis';
import { AdminSearchTimeoutJobData, DELIVERY_JOBS, DELIVERY_QUEUES, DriverRoundTimeoutJobData, NotificationJobData, VendorTimeoutJobData } from './queue.constants';

// Bull MQ initialization
export const dispatchQueue = new Queue(DELIVERY_QUEUES.DISPATCH, {
    connection : redisConnection,
    defaultJobOptions : {
        attempts : 3,
        backoff : {
            type : 'exponential',
            delay : 2000,
        },
        removeOnComplete: true, // auto clean after success save to redis memo
        removeOnFail: false, // keep failed jobs
    },
});

export const notificationQueue = new Queue(DELIVERY_QUEUES.NOTIFICATIONS, {
    connection : redisConnection,
    defaultJobOptions : {
        attempts : 3,
        backoff : {
            type : 'exponential',
            delay : 1000,
        },
        removeOnComplete : true,
        removeOnFail : false,
    }
})

// Producer helper function

// Schedule vendor response timeout (auto-cancel countdown)
export async function scheduleVendorTimeout(orderId: string,delaySeconds:number = 180) {
    const jobId = `vendor-timeout-${orderId}`;
    return await dispatchQueue.add(
        DELIVERY_JOBS.VENDOR_RESPONSE_TIMEOUT,
        { orderId } as VendorTimeoutJobData,
        { 
            jobId,
            delay: delaySeconds * 1000,
        }
    );
}

export async function cancelVendorTimeout(orderId:string) {
    const jobId = `vendor-timeout-${orderId}`;
    const job = await dispatchQueue.getJob(jobId);
    if(job){
        await job.remove();
        console.log(`[Queue] Cancelled vendor timeout job for order : ${orderId}`);
    }
}

// Schedule Driver round timeout
export async function scheduleDriverRoundTimeout(orderId:string,roundNumber:number,radiusKm:number,delaySeconds:number=60) {
    const jobId = `driver-round-${orderId}-${roundNumber}`;
    return await dispatchQueue.add(
        DELIVERY_JOBS.DRIVER_ROUND_TIMEOUT,
        { orderId, roundNumber, radiusKm } as DriverRoundTimeoutJobData,
        {
            jobId,
            delay : delaySeconds * 1000,
        }
    );
}

// Schedule total search timeout / admin alert ( 3 - 4 minutes )
export async function scheduleAdminSearchTimeout(orderId:string,delaySeconds:number=240) {
    const jobId = `admin-timeout-${orderId}`;
    return await dispatchQueue.add(
        DELIVERY_JOBS.ADMIN_SEARCH_TIMEOUT,
        { orderId } as AdminSearchTimeoutJobData,
        {
            jobId,
            delay : delaySeconds * 1000,
        }
    );
}

// Queue async FCM push notification
export async function queuePushNotification(payload: NotificationJobData) {
    return await notificationQueue.add(
        DELIVERY_JOBS.SEND_PUSH_NOTIFICATION,
        payload
    );
}