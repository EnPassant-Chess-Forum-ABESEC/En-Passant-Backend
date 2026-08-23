import { Queue } from "bullmq";
import { createRedisConnection } from "../../redis/redis.client.js";

export const emailQueue = new Queue("email-queue", {
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

export const enqueuePaymentPendingEmail = async (
  userId,
  email,
  name,
  primaryDept,
  secondaryDept,
) => {
  try {
    await emailQueue.add("send-payment-pending-email", {
      userId,
      email,
      name,
      primaryDept,
      secondaryDept,
    });
    console.log(`Enqueued payment pending email for user ${userId}`);
  } catch (error) {
    console.error(
      `Failed to enqueue payment pending email for ${userId}:`,
      error,
    );
  }
};

export const enqueuePaymentSuccessEmail = async (
  userId,
  email,
  name,
  receiptUrl,
) => {
  try {
    await emailQueue.add("send-payment-success-email", {
      userId,
      email,
      name,
      receiptUrl,
    });
    console.log(`Enqueued payment success email for user ${userId}`);
  } catch (error) {
    console.error(
      `Failed to enqueue payment success email for ${userId}:`,
      error,
    );
  }
};

export const enqueuePaymentFailedEmail = async (
  userId,
  email,
  name,
  reason,
) => {
  try {
    await emailQueue.add("send-payment-failed-email", {
      userId,
      email,
      name,
      reason,
    });
    console.log(`Enqueued payment failed email for user ${userId}`);
  } catch (error) {
    console.error(
      `Failed to enqueue payment failed email for ${userId}:`,
      error,
    );
  }
};

export const enqueueContactUsEmail = async (name, email, subject, message) => {
  try {
    await emailQueue.add("send-contact-us-email", {
      name,
      email,
      subject,
      message,
    });
    console.log(`Enqueued contact us email from ${email}`);
  } catch (error) {
    console.error(`Failed to enqueue contact us email from ${email}:`, error);
  }
};

export const enqueueDraftReminderEmail = async (userId, email, name) => {
  try {
    await emailQueue.add("send-draft-reminder-email", {
      userId,
      email,
      name,
    });
    console.log(`Enqueued draft reminder email for user ${userId}`);
  } catch (error) {
    console.error(
      `Failed to enqueue draft reminder email for ${userId}:`,
      error,
    );
  }
};

export const scheduleTasksAvailableDispatch = async (applicationEndDate) => {
  try {
    const delay = Math.max(
      0,
      new Date(applicationEndDate).getTime() - Date.now(),
    );

    const existingJob = await emailQueue.getJob("dispatch-tasks-available-job");
    if (existingJob) {
      await existingJob.remove();
    }

    await emailQueue.add(
      "dispatch-tasks-available",
      {},
      {
        jobId: "dispatch-tasks-available-job",
        delay,
      },
    );
    console.log(
      `Scheduled tasks available dispatch job with delay: ${delay}ms`,
    );
  } catch (error) {
    console.error("Failed to schedule tasks available dispatch:", error);
  }
};

export const enqueueTasksAvailableEmail = async (userId, email, name) => {
  try {
    await emailQueue.add("send-tasks-available-email", {
      userId,
      email,
      name,
    });
    console.log(`Enqueued tasks available email for user ${userId}`);
  } catch (error) {
    console.error(
      `Failed to enqueue tasks available email for ${userId}:`,
      error,
    );
  }
};
