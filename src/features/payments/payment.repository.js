import Payment from "./payment.model.js";
import User from "../users/user.model.js";
import Event from "../events/event.model.js";
import { EventRegistration } from "../events/registration/event.registration.model.js";
import mongoose from "mongoose";

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

export const countPayments = async (filter = {}) => {
  return Payment.countDocuments(filter);
};

export const getPaymentById = async (id) => {
  return Payment.findById(id);
};

export const getPaymentByRegistrationId = async (registrationId) => {
  return Payment.findOne({ registrationId });
};

export const hasPendingPaymentByApplicationId = async (applicationId) => {
  const pendingPayment = await Payment.findOne({ applicationId, status: "PENDING" });
  return !!pendingPayment;
};

export const getAllPayments = async (pageSize = 10, pageNumber = 1, filter = {}) => {
  return Payment.find(filter)
    .select("-receiptFile")
    .populate("userId", "userName email collegeEmail phoneNumber")
    .populate("eventId", "title participationMode")
    .populate({
      path: "registrationId",
      populate: {
        path: "registeredBy",
        select: "userName email",
      },
    })
    .sort({ createdAt: -1 })
    .allowDiskUse(true)
    .limit(Number(pageSize))
    .skip((Number(pageNumber) - 1) * Number(pageSize));
};

export const getAllPaymentsForExport = async (filter = {}) => {
  return Payment.find(filter)
    .select("-receiptFile")
    .populate("userId", "userName email collegeEmail phoneNumber")
    .populate("eventId", "title participationMode")
    .populate("registrationId", "section bracket teamName clubName chessUsername")
    .sort({ createdAt: -1 })
    .allowDiskUse(true);
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

export const deletePaymentByRegistrationId = async (registrationId) => {
  return Payment.deleteMany({ registrationId });
};
