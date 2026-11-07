import { dispatchWorker, notificationWorker } from "./delivery.worker";

console.log(`[BullMQ] Delivery system workers started successfully.`);

const shutdown = async(signal:string) => {
    console.log(`\nReceived ${signal}. Shutting down BullMQ workers successfully..`);
    await Promise.all([
        dispatchWorker.close(),
        notificationWorker.close()
    ]);
    console.log('All workersare closed. Exiting process.');
    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));