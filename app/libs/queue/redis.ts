import { Redis , RedisOptions } from 'ioredis';

const redisConfig: RedisOptions = {
    host : process.env.REDIS_HOST || '127.0.0.1',
    port : Number(process.env.REDIS_PORT) || 6379,
    password : process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest : null, // Required by BullMQ for blocking command listeners
    enableReadyCheck : false,
}

declare global {
    var globalRedisClient: Redis | undefined;
}

export const redisConnection = global.globalRedisClient ?? new Redis(redisConfig);

if(process.env.NODE_ENV !== 'production') {
    global.globalRedisClient = redisConnection;
}

redisConnection.on('connect', () => {
    console.log('[Redis] connected successfully');
});

redisConnection.on('error',(err) => {
    console.error('[Redis] connection error :',err);
})