import { Worker } from "bullmq";
import { redisConnection } from "./sync.queue.js";
import { syncUserAccounts } from "./sync.engine.js";

export const initSyncWorker = () => {
  const worker = new Worker(
    "sync-queue",
    async (job) => {
      if (job.name === "dispatch-daily-sync") {
        console.log(`[Worker] Running daily sync dispatcher...`);
        const { default: User } = await import("../users/user.model.js");
        const { enqueueSyncJob } = await import("./sync.queue.js");

        const users = await User.find(
          {
            $or: [
              { "chessAccounts.chessCom.username": { $exists: true, $ne: "" } },
              { "chessAccounts.lichess.username": { $exists: true, $ne: "" } },
            ],
          },
          "_id",
        );

        console.log(`[Worker] Found ${users.length} users to sync.`);
        for (const user of users) {
          await enqueueSyncJob(user._id, "cron");
        }
        return { dispatched: users.length };
      }

      if (job.name === "sync-user") {
        const { userId, triggeredBy } = job.data;
        console.log(
          `[Worker] Processing sync job for user ${userId} (trigger: ${triggeredBy})`,
        );

        const results = await syncUserAccounts(userId);
        return results;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on("completed", (job, returnvalue) => {
    console.log(
      `[Worker] Completed sync job for user ${job.data.userId}`,
      returnvalue,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[Worker] Failed sync job for user ${job.data.userId}:`,
      err.message,
    );
  });

  return worker;
};
