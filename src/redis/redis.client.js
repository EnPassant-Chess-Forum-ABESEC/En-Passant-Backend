import IORedis from "ioredis";

const redisOptions = {
  maxRetriesPerRequest: null,
};

export const createRedisConnection = () =>
  new IORedis(process.env.REDIS_URL, redisOptions);
export const redisConnection = createRedisConnection();

export const clearAdminCache = async (pattern) => {
  try {
    const keys = await redisConnection.keys(pattern);
    if (keys && keys.length > 0) {
      await redisConnection.del(...keys);
    }
  } catch (err) {
    console.error(`Redis cache clear error for pattern ${pattern}:`, err);
  }
};
