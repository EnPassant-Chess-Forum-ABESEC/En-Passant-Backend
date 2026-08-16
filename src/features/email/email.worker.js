import { workerLogger } from "../../utils/logger.js";
import { Worker } from "bullmq";
import { createRedisConnection } from "../../redis/redis.client.js";
import { sendEmail } from "./email.service.js";

import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processEmailJob = async (job) => {
  const { name, data } = job;

  if (name === "send-welcome-email") {
    const { userId, email, name: userName } = data;

    const templatePath = path.join(__dirname, "templates", "welcome.ejs");

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const profileUrl = `${frontendUrl.replace(/\/$/, "")}/profile`;
    const onboardingUrl = `${profileUrl}?onboarding=true`;

    const html = await ejs.renderFile(templatePath, {
      userName,
      profileUrl,
      onboardingUrl,
      year: new Date().getFullYear(),
    });

    const subject = "Welcome to En-Passant!";
    const text = `Hi ${userName},\n\nWelcome to En-Passant. We're excited to have you on board!`;

    await sendEmail({ to: email, subject, text, html });
  } else if (name === "send-payment-pending-email") {
    const { email, name: userName, primaryDept, secondaryDept } = data;

    const subject = "Payment Under Review - En-Passant Recruitment";
    const text = `Hi ${userName},\n\nWe have received your payment details. Your payment is currently under review by our administrators.\n\nYou will receive your official receipt once the payment is verified. You can also check your application status on your dashboard.`;

    const templatePath = path.join(
      __dirname,
      "templates",
      "payment_pending.ejs",
    );
    const html = await ejs.renderFile(templatePath, {
      userName,
      primaryDept,
      secondaryDept,
    });

    await sendEmail({ to: email, subject, text, html });
  } else if (name === "send-payment-success-email") {
    const { email, name: userName, receiptUrl } = data;

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const recruitmentDashboardUrl = `${frontendUrl.replace(/\/$/, "")}/recruitment/dashboard`;

    const subject = "Payment Verified & Receipt - En-Passant Recruitment";
    const text = `Hi ${userName},\n\nYour payment has been successfully verified! You can now proceed with your recruitment tasks.\n\nRecruitment Dashboard: ${recruitmentDashboardUrl}\n\nYou can download your official receipt here: ${receiptUrl}`;

    const templatePath = path.join(
      __dirname,
      "templates",
      "payment_success.ejs",
    );
    const html = await ejs.renderFile(templatePath, {
      userName,
      receiptUrl,
      recruitmentDashboardUrl,
    });

    await sendEmail({ to: email, subject, text, html });
  } else if (name === "send-payment-failed-email") {
    const { email, name: userName, reason } = data;

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const applyUrl = `${frontendUrl.replace(/\/$/, "")}/recruitment/apply`;

    const subject = "Payment Issue - En-Passant Recruitment";
    const text = `Hi ${userName},\n\nThere was an issue verifying your payment for the En-Passant recruitment. \n\nReason: ${reason || "Verification failed."}\n\nPlease try again at ${applyUrl}`;

    const templatePath = path.join(
      __dirname,
      "templates",
      "payment_failed.ejs",
    );
    const html = await ejs.renderFile(templatePath, {
      userName,
      reason,
      applyUrl,
    });

    await sendEmail({ to: email, subject, text, html });
  } else if (name === "send-contact-us-email") {
    const { name: userName, email: userEmail, message } = data;

    const subject = `Contact Form: ${userName}`;
    const text = `New message from ${userName} (${userEmail}):\n\n${message}`;

    const templatePath = path.join(__dirname, "templates", "contact_us.ejs");
    const html = await ejs.renderFile(templatePath, {
      userName,
      userEmail,
      message,
    });

    await sendEmail({
      to: "enpassantabes@gmail.com",
      subject,
      text,
      html,
      replyTo: userEmail,
    });
  }
};

export const initEmailWorker = () => {
  const emailWorker = new Worker("email-queue", processEmailJob, {
    connection: createRedisConnection(),
    concurrency: 5,
  });

  emailWorker.on("completed", (job) => {
    workerLogger.log(
      `Email job ${job.id} of type ${job.name} completed successfully.`,
    );
  });

  emailWorker.on("failed", (job, err) => {
    workerLogger.error(`Email job ${job?.id} failed:`, err);
  });

  workerLogger.log("Email worker initialized");
};
