import { Worker } from "bullmq";
import { redisConnection } from "../../redis/redis.client.js";
import Payment from "./payment.model.js";
import { uploadFile } from "../storage/storage.service.js";

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
      userEmail: user.collegeEmail,
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

    const cloudinaryResult = await uploadFile(pdfBuffer, {
      folder: "en-passant/receipts",
      resource_type: "raw",
      public_id: `receipt_${payment._id}`,
    });

    payment.receiptPublicId = cloudinaryResult.public_id;
    payment.receiptUrl = cloudinaryResult.secure_url;
    await payment.save();

    console.log(
      `Successfully generated and uploaded receipt for payment ${payment._id}`,
    );

    import("../email/email.queue.js").then((module) => {
      module.enqueuePaymentSuccessEmail(
        user._id,
        user.collegeEmail,
        user.userName,
        cloudinaryResult.secure_url
      );
    });
  }
};

export const initReceiptWorker = () => {
  const receiptWorker = new Worker("receipt-queue", processReceiptJob, {
    connection: redisConnection,
    concurrency: 2,
  });

  receiptWorker.on("completed", (job) => {
    console.log(`Receipt job ${job.id} completed successfully.`);
  });

  receiptWorker.on("failed", (job, err) => {
    console.error(`Receipt job ${job?.id} failed:`, err);
  });

  console.log("Receipt worker initialized");
};
