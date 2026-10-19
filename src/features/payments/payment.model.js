import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruitment",
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    purpose: {
      type: String,
      enum: ["recruitment", "event"],
      default: "recruitment",
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    gateway: {
      type: String,
      default: "RAZORPAY",
    },
    gatewayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    gatewayPaymentId: {
      type: String,
      default: null,
    },
    utr: {
      type: String,
      sparse: true,
    },
    paymentScreenshotPublicId: {
      type: String,
    },
    paymentScreenshotUrl: {
      type: String,
    },
    receiptPublicId: {
      type: String,
      default: null,
    },
    receiptUrl: {
      type: String,
      default: null,
    },
    receiptFile: {
      type: Buffer,
    },
    receiptS3Key: {
      type: String,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
