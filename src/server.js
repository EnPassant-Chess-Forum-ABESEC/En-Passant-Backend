import dotenv from "dotenv";
import app from "./app.js";
import { initSyncWorker } from "./features/sync/sync.worker.js";
import { initSyncScheduler } from "./features/sync/sync.scheduler.js";
import { initRecruitmentScheduler } from "./features/recruitment/recruitment.scheduler.js";
import { initRecruitmentWorker } from "./features/recruitment/recruitment.worker.js";

dotenv.config();

initSyncWorker();
initSyncScheduler();
initRecruitmentScheduler();
initRecruitmentWorker();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
