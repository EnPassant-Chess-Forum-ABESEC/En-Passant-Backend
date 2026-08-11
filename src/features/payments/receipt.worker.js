import { workerLogger } from "../../utils/logger.js";
import { Worker } from "bullmq";
import { createRedisConnection } from "../../redis/redis.client.js";
import Payment from "./payment.model.js";

import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processReceiptJob = async (job) => {
  const { name, data } = job;

  if (name === "generate-receipt") {
    const { paymentId } = data;

    const payment = await Payment.findById(paymentId).populate("userId");
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    const user = payment.userId;
    if (!user) {
      throw new Error(`User not found for payment ${paymentId}`);
    }

    const templatePath = path.join(__dirname, "templates", "receipt.ejs");

    const html = await ejs.renderFile(templatePath, {
      paymentId: payment._id.toString(),
      date: new Date(payment.createdAt).toLocaleDateString(),
      userName: user.userName,
      userEmail: user.email,
      purpose:
        payment.purpose === "recruitment" ? "Recruitment Fee" : "Event Fee",
      amount: payment.amount,
    });

    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "40px", bottom: "40px" },
    });

    await browser.close();

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    const receiptLink = `${backendUrl}/api/payments/${payment._id}/receipt.pdf`;

    payment.receiptFile = Buffer.from(pdfBuffer);
    payment.receiptUrl = receiptLink;
    await payment.save();

    workerLogger.log(
      `Successfully generated and saved receipt to DB for payment ${payment._id}`,
    );

    import("../email/email.queue.js").then((module) => {
      module.enqueuePaymentSuccessEmail(
        user._id,
        user.email,
        user.userName,
        receiptLink,
      );
    });
  }
};

export const initReceiptWorker = () => {
  const receiptWorker = new Worker("receipt-queue", processReceiptJob, {
    connection: createRedisConnection(),
    concurrency: 2,
  });

  receiptWorker.on("completed", (job) => {
    workerLogger.log(`Receipt job ${job.id} completed successfully.`);
  });

  receiptWorker.on("failed", (job, err) => {
    workerLogger.error(`Receipt job ${job?.id} failed:`, err);
  });

  workerLogger.log("Receipt worker initialized");
};
