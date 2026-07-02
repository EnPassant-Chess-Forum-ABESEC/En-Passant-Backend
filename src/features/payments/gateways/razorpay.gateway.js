import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async ({ amount, currency, receipt }) => {
  return razorpay.orders.create({
    amount,
    currency,
    receipt,
  });
};

export const verifySignature = (
  signature,
  razorpayOrderId,
  razorpayPaymentId,
) => {
  return (
    crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex") === signature
  );
};
