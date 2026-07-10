import Payment from "./payment.model.js";

export const createPayment = async (paymentData) => {
  return Payment.create(paymentData);
};

export const updatePaymentStatus = async (
  gatewayOrderId,
  status,
  gatewayPaymentId,
  session
) => {
  return Payment.findOneAndUpdate(
    { gatewayOrderId },
    { status, gatewayPaymentId },
    { returnDocument: "after", session },
  );
};

export const countPayments = async () => {
  return Payment.countDocuments();
};

export const getAllPayments = async (pageSize = 10, pageNumber = 1) => {
  return Payment.find()
    .sort({ createdAt: -1 })
    .limit(Number(pageSize))
    .skip((Number(pageNumber) - 1) * Number(pageSize));
};
