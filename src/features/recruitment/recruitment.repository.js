import Recruitment from "./recruitment.model.js";
import { APPLICATION_STATUS } from "./recruitment.constants.js";

export const createRecruitment = async (recruitment) => {
  return Recruitment.create(recruitment);
};

export const getRecruitmentByUserIdAndYear = async (userId, year) => {
  return Recruitment.findOne({ userId, year }).populate(
    "preferredDepartmentId secondaryDepartmentId",
  );
};

export const getRecruitmentById = async (recruitmentid) => {
  return Recruitment.findById(recruitmentid).populate(
    "preferredDepartmentId secondaryDepartmentId",
  );
};

export const findAllRecruitment = async (filter) => {
  return Recruitment.find(filter).populate(
    "preferredDepartmentId secondaryDepartmentId",
  );
};

export const updateRecruitmentStatus = async (id, status) => {
  return Recruitment.findByIdAndUpdate(id, { status }, { new: true });
};

export const findExpiredPendingPayments = async (cutoffDate) => {
  return Recruitment.find({
    status: APPLICATION_STATUS.PAYMENT_PENDING,
    createdAt: { $lt: cutoffDate },
  });
};

export const deleteApplication = async (id) => {
  return Recruitment.findByIdAndDelete(id);
};
