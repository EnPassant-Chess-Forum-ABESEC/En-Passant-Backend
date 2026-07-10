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
      required: true, // Razorpay order_id
      unique: true,
    },
    gatewayPaymentId: {
      type: String, // The Razorpay payment_id
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
