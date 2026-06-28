import { syncQueue } from "./sync.queue.js";

export const initSyncScheduler = async () => {
  await syncQueue.add(
    "dispatch-daily-sync",
    {},
    {
      repeat: {
        pattern: "0 0 * * *",
      },
      jobId: "daily-sync-dispatcher",
    },
  );

  console.log(`[Scheduler] Daily sync dispatcher scheduled (0 0 * * *)`);
};
