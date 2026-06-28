import dotenv from "dotenv";
import app from "./app.js";
import { initSyncWorker } from "./features/sync/sync.worker.js";
import { initSyncScheduler } from "./features/sync/sync.scheduler.js";

dotenv.config();

initSyncWorker();
initSyncScheduler();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
