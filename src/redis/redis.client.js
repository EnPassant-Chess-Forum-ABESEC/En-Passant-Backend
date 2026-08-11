import IORedis from "ioredis";

const redisOptions = {
  maxRetriesPerRequest: null,
};

export const createRedisConnection = () => new IORedis(process.env.REDIS_URL, redisOptions);
export const redisConnection = createRedisConnection();
