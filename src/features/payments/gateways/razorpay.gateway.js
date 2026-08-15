import { AppError } from "../../../utils/AppError.js";
import Razorpay from "razorpay";

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export const createOrder = async ({ amount, currency, receipt, notes }) => {
  if (!razorpay) {
    throw new AppError("Razorpay is not configured on this server (keys missing)", 500);
  }
  return razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
};
