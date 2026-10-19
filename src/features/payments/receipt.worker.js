import { AppError } from "../../utils/AppError.js";
import { workerLogger } from "../../utils/logger.js";
import { Worker } from "bullmq";
import { createRedisConnection, clearAdminCache } from "../../redis/redis.client.js";
import Payment from "./payment.model.js";
import Event from "../events/event.model.js";
import { EventRegistration } from "../events/registration/event.registration.model.js";

import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const getS3Client = () => {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalBrowser = null;

const getBrowser = async () => {
  if (!globalBrowser) {
    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    globalBrowser = await puppeteer.launch(launchOptions);
    globalBrowser.on("disconnected", () => {
      globalBrowser = null;
    });
  }
  return globalBrowser;
};

const processReceiptJob = async (job) => {
  const { name, data } = job;

  if (name === "generate-receipt") {
    const { paymentId } = data;

    const payment = await Payment.findById(paymentId)
      .populate("userId")
      .populate("eventId")
      .populate("registrationId");
    if (!payment) {
      throw new AppError(`Payment with ID ${paymentId} not found`, 404);
    }

    const user = payment.userId;
    if (!user) {
      throw new AppError(`User not found for payment ${paymentId}`, 404);
    }

    const isEvent =
      payment.purpose === "event" ||
      Boolean(payment.registrationId) ||
      Boolean(payment.eventId) ||
      payment.gatewayOrderId?.includes("event");

    let event = payment.eventId;
    if (!event && payment.registrationId) {
      const regId = payment.registrationId._id || payment.registrationId;
      const regDoc =
        await EventRegistration.findById(regId).populate("eventId");
      if (regDoc?.eventId) {
        event = regDoc.eventId;
      }
    }

    const eventTitle =
      event?.title ||
      payment.eventId?.title ||
      "ABES Chess Championship (ACC 2026)";

    const sectionName = payment.registrationId?.section
      ? `${payment.registrationId.section.charAt(0).toUpperCase() + payment.registrationId.section.slice(1)} Section`
      : "";

    const purposeText = isEvent
      ? `${eventTitle}${sectionName ? ` - ${sectionName}` : ""}`
      : "Recruitment Registration Fee";

    const templatePath = path.join(__dirname, "templates", "receipt.ejs");

    const html = await ejs.renderFile(templatePath, {
      paymentId: payment.utr ? `${payment._id} (${payment.utr})` : payment._id.toString(),
      date: new Date(payment.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      userName: user.userName || "Participant",
      userEmail: user.email || "",
      purpose: purposeText,
      amount: payment.amount / 100,
    });

    const browser = await getBrowser();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 60000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await page.close();

    const backendUrl =
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://en-passant-backend.onrender.com"
        : `http://localhost:${process.env.PORT || 8080}`);
    const receiptLink = `${backendUrl.replace(/\/$/, "").replace(/\/api$/, "")}/api/payments/${payment._id}/receipt.pdf`;

    const s3Key = `receipts/receipt_${payment._id}.pdf`;

    const s3 = getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      }),
    );

    payment.receiptFile = undefined;
    payment.receiptS3Key = s3Key;
    payment.receiptUrl = receiptLink;
    await payment.save();

    if (payment.registrationId) {
      const regId = payment.registrationId._id || payment.registrationId;
      await EventRegistration.findByIdAndUpdate(regId, {
        receiptUrl: receiptLink,
      });
    }

    await clearAdminCache("admin:payments:*");

    workerLogger.log(
      `Successfully generated and uploaded receipt to R2 for payment ${payment._id}`,
    );

    import("../email/email.queue.js").then((module) => {
      module.enqueuePaymentSuccessEmail(
        user._id,
        user.email,
        user.userName,
        receiptLink,
        {
          pdfBase64: pdfBuffer.toString("base64"),
          isEvent: Boolean(isEvent),
          eventTitle: isEvent ? eventTitle : undefined,
          sectionName: isEvent ? sectionName : undefined,
          eventId:
            event?._id?.toString() ||
            payment.eventId?._id?.toString() ||
            payment.eventId?.toString() ||
            undefined,
          amount: payment.amount / 100,
          paymentId: payment._id.toString(),
        },
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
