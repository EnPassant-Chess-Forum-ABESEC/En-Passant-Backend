import "dotenv/config";
import app from "./app.js";
import { initSyncWorker } from "./features/sync/sync.worker.js";
import { initSyncScheduler } from "./features/sync/sync.scheduler.js";
import { initEmailWorker } from "./features/email/email.worker.js";
import { initReceiptWorker } from "./features/payments/receipt.worker.js";
import Settings from "./features/settings/settings.model.js";
import { scheduleTasksAvailableDispatch } from "./features/email/email.queue.js";



initSyncWorker();
initSyncScheduler();
initEmailWorker();
initReceiptWorker();

app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  
  try {
    const settings = await Settings.findOne();
    if (settings) {
      await scheduleTasksAvailableDispatch(settings.applicationEndDate);
    }
  } catch (error) {
    console.error("Failed to schedule tasks available dispatch on startup:", error);
  }
});
