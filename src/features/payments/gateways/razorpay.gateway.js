import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async ({ amount, currency, receipt, notes }) => {
  return razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
};
