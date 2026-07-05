import { Queue } from "bullmq";
import { redisConnection } from "../../redis/redis.client.js";

export const recruitmentQueue = new Queue("recruitment-queue", {
  connection: redisConnection,
});

export const enqueueRecruitmentJob = async (userId, triggeredBy = "manual") => {
  await recruitmentQueue.add(
    "process-recruitment",
    { userId, triggeredBy },
    {
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
  console.log(`[Queue] Enqueued recruitment job for user ${userId}`);
};
