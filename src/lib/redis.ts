import Redis from "ioredis";

// Establish a singleton connection.
// In Next.js, this ensures hot reloads don't create multiple connections to the Redis server.

const getRedisUrl = () => {
    // Check if REDIS_PUBLIC_URL is present in the environment variables
    const url = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL;
    if (!url) {
        console.warn("⚠️ REDIS_PUBLIC_URL is not set. Caching functionality may fail.");
        return "";
    }
    return url;
};

// Check if we are running in development, standard practice for Next.js db singletons
const globalForRedis = global as unknown as { redis: Redis };

export const redis =
    globalForRedis.redis || new Redis(getRedisUrl(), {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export default redis;
