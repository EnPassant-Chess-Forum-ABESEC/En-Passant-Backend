import "dotenv/config";
import app from "./app.js";
import { initSyncWorker } from "./features/sync/sync.worker.js";
import { initSyncScheduler } from "./features/sync/sync.scheduler.js";
import { initEmailWorker } from "./features/email/email.worker.js";
import { initReceiptWorker } from "./features/payments/receipt.worker.js";



initSyncWorker();
initSyncScheduler();
initEmailWorker();
initReceiptWorker();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
