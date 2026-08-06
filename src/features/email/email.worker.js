import { Worker } from "bullmq";
import { redisConnection } from "../../redis/redis.client.js";
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

    const html = await ejs.renderFile(templatePath, {
      userName,
      loginUrl: "http://localhost:3000/login",
      year: new Date().getFullYear(),
    });

    const subject = "Welcome to En-Passant!";
    const text = `Hi ${userName},\n\nWelcome to En-Passant. We're excited to have you on board!`;

    await sendEmail({ to: email, subject, text, html });
  } else if (name === "send-payment-pending-email") {
    const { email, name: userName } = data;
    
    const subject = "Payment Under Review - En-Passant Recruitment";
    const text = `Hi ${userName},\n\nWe have received your manual payment details. Your payment is currently under review by our administrators.\n\nYou will receive your official receipt once the payment is verified. You can also check your application status on your dashboard.`;
    
    const templatePath = path.join(__dirname, "templates", "payment_pending.ejs");
    const html = await ejs.renderFile(templatePath, { userName });

    await sendEmail({ to: email, subject, text, html });
  } else if (name === "send-payment-success-email") {
    const { email, name: userName, receiptUrl } = data;
    
    const subject = "Payment Verified & Receipt - En-Passant Recruitment";
    const text = `Hi ${userName},\n\nYour payment has been successfully verified! You can now proceed with your recruitment tasks.\n\nYou can download your official receipt here: ${receiptUrl}`;
    
    const templatePath = path.join(__dirname, "templates", "payment_success.ejs");
    const html = await ejs.renderFile(templatePath, { userName, receiptUrl });

    await sendEmail({ to: email, subject, text, html });
  }
};

export const initEmailWorker = () => {
  const emailWorker = new Worker("email-queue", processEmailJob, {
    connection: redisConnection,
    concurrency: 5,
  });

  emailWorker.on("completed", (job) => {
    console.log(
      `Email job ${job.id} of type ${job.name} completed successfully.`,
    );
  });

  emailWorker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err);
  });

  console.log("Email worker initialized");
};
