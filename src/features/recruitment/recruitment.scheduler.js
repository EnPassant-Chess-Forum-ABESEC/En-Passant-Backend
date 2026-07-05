import { recruitmentQueue } from "./recruitment.queue.js";

export const initRecruitmentScheduler = () => {
  recruitmentQueue.add(
    "expire-pending-payments",
    {},
    {
      repeat: {
        pattern: "0 0 * * *",
      },
      jobId: "expire-pending-payments-dispatcher",
    },
  );

  console.log(
    `[Scheduler] Expire pending payments dispatcher scheduled (0 0 * * *)`,
  );
};
