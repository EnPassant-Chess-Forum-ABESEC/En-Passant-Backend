import {
  getMyApplication,
  handleSuccessfulPayment,
} from "../recruitment/recruitment.service.js";
import { createOrder } from "./gateways/razorpay.gateway.js";
import Razorpay from "razorpay";
import * as paymentRepo from "./payment.repository.js";
import mongoose from "mongoose";
import { uploadFile } from "../storage/storage.service.js";

export const createCheckoutSession = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const currentYear = new Date().getFullYear();
    const application = await getMyApplication(userId, currentYear);
    if (!application) throw new Error("Application not found");

    if (
      application.status === "ACTIVE" ||
      application.paymentStatus === "SUCCESS"
    )
      throw new Error(
        "Application is already active or payment is already done",
      );

    const recruitmentAmount = process.env.RECRUITMENT_AMOUNT;
    if (!recruitmentAmount) throw new Error("Recruitment amount not found");

    const recruitmentAmountInPaise = parseInt(recruitmentAmount) * 100;

    const order = await createOrder({
      amount: recruitmentAmountInPaise,
      currency: "INR",
      receipt: `recruitment_${application._id}`,
      notes: {
        applicationId: application._id.toString(),
      },
    });

    const payment = await paymentRepo.createPayment({
      userId: application.userId,
      applicationId: application._id,
      amount: recruitmentAmountInPaise,
      currency: "INR",
      gatewayOrderId: order.id,
      status: "PENDING",
    });

    return res.status(200).json({
      success: true,
      order,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

export const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const { event, payload } = req.body;

    if (!signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing signature" });
    }

    try {
      Razorpay.validateWebhookSignature(
        req.rawBody,
        signature,
        process.env.RAZORPAY_WEBHOOK_SECRET,
      );
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      const paymentId = payment.id;
      const orderId = payment.order_id;

      const applicationId = payment.notes?.applicationId;

      if (applicationId) {
        try {
          await handleSuccessfulPayment(applicationId, paymentId);

          const updatedPayment = await paymentRepo.updatePaymentStatus(
            orderId,
            "SUCCESS",
            paymentId
          );

          if (updatedPayment) {
            import("./receipt.queue.js").then((module) => {
              module.enqueueReceiptGeneration(updatedPayment._id);
            });
          }
        } catch (error) {
          throw error;
        }
      } else {
        console.warn(
          "Application ID not found in Razorpay payment notes",
          paymentId,
        );
      }
    } else if (event === "payment.failed") {
      const payment = payload.payment.entity;
      const paymentId = payment.id;
      const orderId = payment.order_id;

      await paymentRepo.updatePaymentStatus(orderId, "FAILED", paymentId);
    }

    return res.status(200).send("OK");
  } catch (error) {
    next(error);
  }
};

export const getReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentRepo.getPaymentById(id);

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (
      payment.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!payment.receiptUrl) {
      return res
        .status(404)
        .json({ success: false, message: "Receipt not generated yet" });
    }

    return res.status(200).json({ success: true, url: payment.receiptUrl });
  } catch (error) {
    next(error);
  }
};

export const downloadReceiptPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentRepo.getPaymentById(id);

    if (!payment || !payment.receiptFile) {
      return res.status(404).send("Receipt not found");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="receipt_${id}.pdf"`);
    res.send(payment.receiptFile);
  } catch (error) {
    next(error);
  }
};

export const submitManualPayment = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const { utr } = req.body;
    if (!utr) {
      return res
        .status(400)
        .json({ success: false, message: "UTR (Transaction ID) is required." });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Payment screenshot is required." });
    }

    const currentYear = new Date().getFullYear();
    const application = await getMyApplication(userId, currentYear);
    if (!application) throw new Error("Application not found");

    if (
      application.status === "ACTIVE" ||
      application.paymentStatus === "SUCCESS"
    ) {
      throw new Error(
        "Application is already active or payment is already done",
      );
    }

    const userNameSanitized = req.user.userName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    const dateStr = new Date().toISOString().split("T")[0];
    const publicId = `receipts/${userNameSanitized}_${dateStr}_${Date.now()}`;

    const uploadResult = await uploadFile(req.file.buffer, {
      public_id: publicId,
      folder: "manual_payments",
    });

    const recruitmentAmount = process.env.RECRUITMENT_AMOUNT;
    if (!recruitmentAmount) throw new Error("Recruitment amount not found");

    const recruitmentAmountInPaise = parseInt(recruitmentAmount) * 100;

    const payment = await paymentRepo.createPayment({
      userId: application.userId,
      applicationId: application._id,
      amount: recruitmentAmountInPaise,
      currency: "INR",
      gateway: "MANUAL",
      gatewayOrderId: `manual_order_${Date.now()}`,
      status: "PENDING",
      utr,
      paymentScreenshotPublicId: uploadResult.public_id,
      paymentScreenshotUrl: uploadResult.secure_url,
    });

    import("../email/email.queue.js").then((module) => {
      module.enqueuePaymentPendingEmail(
        req.user._id,
        req.user.collegeEmail,
        req.user.userName,
      );
    });

    return res.status(200).json({
      success: true,
      message: "Payment submitted manually and is pending verification.",
      payment,
    });
  } catch (error) {
    next(error);
  }
};
