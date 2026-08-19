import Payment from "./payment.model.js";
import User from "../users/user.model.js";
import mongoose from "mongoose";

export const buildPaymentQuery = async (search, status) => {
  const query = {};

  if (status && status !== "ALL") {
    query.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    const matchingUsers = await User.find({
      $or: [{ userName: searchRegex }, { email: searchRegex }],
    }).select("_id");
    
    const userIds = matchingUsers.map((u) => u._id);
    
    query.$or = [
      { applicationId: searchRegex },
      { userId: { $in: userIds } },
    ];
    if (mongoose.Types.ObjectId.isValid(search)) {
      query.$or.push({ _id: search });
    }
  }

  return query;
};

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

export const countPayments = async (search = "", status = "ALL") => {
  const query = await buildPaymentQuery(search, status);
  return Payment.countDocuments(query);
};

export const getPaymentById = async (id) => {
  return Payment.findById(id);
};

export const hasPendingPaymentByApplicationId = async (applicationId) => {
  const pendingPayment = await Payment.findOne({ applicationId, status: "PENDING" });
  return !!pendingPayment;
};

export const getAllPayments = async (pageSize = 10, pageNumber = 1, search = "", status = "ALL", sort = "NEWEST") => {
  const query = await buildPaymentQuery(search, status);
  const sortOrder = sort === "OLDEST" ? { createdAt: 1 } : { createdAt: -1 };

  return Payment.find(query)
    .select("-receiptFile")
    .populate("userId", "userName email collegeEmail")
    .sort(sortOrder)
    .limit(Number(pageSize))
    .skip((Number(pageNumber) - 1) * Number(pageSize));
};

export const getAllPaymentsForExport = async () => {
  return Payment.find()
    .select("-receiptFile")
    .populate("userId", "userName email collegeEmail phoneNumber")
    .sort({ createdAt: -1 });
};

export const calculateTotalRevenue = async () => {
  const result = await Payment.aggregate([
    { $match: { status: "SUCCESS" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total || 0;
};

export const deletePaymentByApplicationId = async (applicationId) => {
  return Payment.deleteMany({ applicationId });
};
