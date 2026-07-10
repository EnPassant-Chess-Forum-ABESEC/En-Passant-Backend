import {
  getMyApplication,
  handleSuccessfulPayment,
} from "../recruitment/recruitment.service.js";
import { createOrder } from "./gateways/razorpay.gateway.js";
import Razorpay from "razorpay";

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

    return res.status(200).json({
      success: true,
      order,
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

      const applicationId = payment.notes?.applicationId;

      if (applicationId) {
        await handleSuccessfulPayment(applicationId, paymentId);
      } else {
        console.warn(
          "Application ID not found in Razorpay payment notes",
          paymentId,
        );
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    next(error);
  }
};
