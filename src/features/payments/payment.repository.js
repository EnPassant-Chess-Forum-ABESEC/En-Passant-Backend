import Payment from "./payment.model.js";

export const createPayment = async (paymentData) => {
  return Payment.create(paymentData);
};

export const updatePaymentStatus = async (
  gatewayOrderId,
  status,
  gatewayPaymentId,
  session,
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

export const getPaymentById = async (id) => {
  return Payment.findById(id);
};

export const getAllPayments = async (pageSize = 10, pageNumber = 1) => {
  return Payment.find()
    .populate("userId", "userName collegeEmail")
    .sort({ createdAt: -1 })
    .limit(Number(pageSize))
    .skip((Number(pageNumber) - 1) * Number(pageSize));
};

export const getAllPaymentsForExport = async () => {
  return Payment.find()
    .populate("userId", "userName collegeEmail phoneNumber")
    .sort({ createdAt: -1 });
};

export const calculateTotalRevenue = async () => {
  const result = await Payment.aggregate([
    { $match: { status: "SUCCESS" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total || 0;
};
