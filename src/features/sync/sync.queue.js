import { Queue } from "bullmq";
import { redisConnection } from "../../redis/redis.client.js";

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
