import { workerLogger } from "../../utils/logger.js";
import { Queue } from "bullmq";
import { createRedisConnection } from "../../redis/redis.client.js";

export const syncQueue = new Queue("sync-queue", {
  connection: createRedisConnection(),
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
  workerLogger.log(
    `[Queue] Enqueued sync job for user ${userId} (trigger: ${triggeredBy})`,
  );
};
