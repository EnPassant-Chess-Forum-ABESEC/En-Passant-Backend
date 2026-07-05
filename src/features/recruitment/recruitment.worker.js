import { Worker } from "bullmq";
import { redisConnection } from "../../redis/redis.client.js";
import { autoRejectExpiredApplications } from "./recruitment.service.js";

export const initRecruitmentWorker = async () => {
  const worker = new Worker(
    "recruitment-queue",
    async (job) => {
      if (job.name === "expire-pending-payments") {
        console.log(`[Worker] Running expire-pending-payments job`);

        const rejected = await autoRejectExpiredApplications();

        return rejected;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2,
    },
  );

  worker.on("completed", (job, returnValue) => {
    console.log(`[Worker] Expiration job completed`, returnValue);
  });

  worker.on("failed", (job, err) => {
    console.log(`[Worker] Expiration job failed: ${err.message}`);
  });

  return worker;
};
