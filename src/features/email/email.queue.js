import { Queue } from "bullmq";
import { redisConnection } from "../../redis/redis.client.js";

export const emailQueue = new Queue("email-queue", {
  connection: redisConnection,
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

export const enqueueWelcomeEmail = async (userId, email, name) => {
  try {
    await emailQueue.add("send-welcome-email", {
      userId,
      email,
      name,
    });
    console.log(`Enqueued welcome email for user ${userId}`);
  } catch (error) {
    console.error(`Failed to enqueue welcome email for ${userId}:`, error);
  }
};

export const enqueuePaymentPendingEmail = async (userId, email, name) => {
  try {
    await emailQueue.add("send-payment-pending-email", {
      userId,
      email,
      name,
    });
    console.log(`Enqueued payment pending email for user ${userId}`);
  } catch (error) {
    console.error(`Failed to enqueue payment pending email for ${userId}:`, error);
  }
};

export const enqueuePaymentSuccessEmail = async (userId, email, name, receiptUrl) => {
  try {
    await emailQueue.add("send-payment-success-email", {
      userId,
      email,
      name,
      receiptUrl,
    });
    console.log(`Enqueued payment success email for user ${userId}`);
  } catch (error) {
    console.error(`Failed to enqueue payment success email for ${userId}:`, error);
  }
};
