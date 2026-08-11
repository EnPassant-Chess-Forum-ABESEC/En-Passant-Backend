import { Queue } from "bullmq";
import { createRedisConnection } from "../../redis/redis.client.js";

export const receiptQueue = new Queue("receipt-queue", {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const enqueueReceiptGeneration = async (paymentId) => {
  try {
    await receiptQueue.add("generate-receipt", {
      paymentId,
    });
    console.log(`Enqueued receipt generation for payment ${paymentId}`);
  } catch (error) {
    console.error(`Failed to enqueue receipt generation for ${paymentId}:`, error);
  }
};
