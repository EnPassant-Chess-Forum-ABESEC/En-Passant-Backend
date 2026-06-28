import IORedis from "ioredis";

const redisOptions = {
  maxRetriesPerRequest: null,
};

export const redisConnection = new IORedis(process.env.REDIS_URL, redisOptions);
