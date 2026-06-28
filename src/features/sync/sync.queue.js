import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisOptions = {
  maxRetriesPerRequest: null,
};

export const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  redisOptions,
);

export const syncQueue = new Queue("sync-queue", {
  connection: redisConnection,
});

export const enqueueSyncJob = async (userId, triggeredBy = "manual") => {
  await syncQueue.add(
    "sync-user",
    { userId, triggeredBy },
    {
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
  console.log(
    `[Queue] Enqueued sync job for user ${userId} (trigger: ${triggeredBy})`,
  );
};
