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
    const html = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1E3A8A;">Payment Received & Under Review</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>We have successfully received your manual payment details for the En-Passant Recruitment.</p>
        <p>Your payment is currently under review by our administrators. Once your payment is verified, we will email you your official receipt and your application status will be updated.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <br/>
        <p>Best regards,<br/><strong>En-Passant Team</strong></p>
      </div>
    `;

    await sendEmail({ to: email, subject, text, html });
  } else if (name === "send-payment-success-email") {
    const { email, name: userName, receiptUrl } = data;
    
    const subject = "Payment Verified & Receipt - En-Passant Recruitment";
    const text = `Hi ${userName},\n\nYour payment has been successfully verified! You can now proceed with your recruitment tasks.\n\nYou can download your official receipt here: ${receiptUrl}`;
    const html = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #15803D;">Payment Verified</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Great news! Your manual payment for the En-Passant Recruitment has been successfully verified.</p>
        <p>You can now log into your dashboard and proceed with your assigned recruitment tasks.</p>
        <p>Your official payment receipt has been generated. You can download it using the link below:</p>
        <div style="margin: 30px 0;">
          <a href="${receiptUrl}" style="background-color: #1E3A8A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download Receipt</a>
        </div>
        <p style="font-size: 0.9em; color: #666;">Or copy this link: <a href="${receiptUrl}">${receiptUrl}</a></p>
        <br/>
        <p>Best regards,<br/><strong>En-Passant Team</strong></p>
      </div>
    `;

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
