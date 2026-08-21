import mongoose from "mongoose";
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
  return Recruitment.findById(recruitmentid)
    .populate("userId", "userName email collegeEmail phoneNumber")
    .populate("preferredDepartmentId secondaryDepartmentId");
};

export const findAllRecruitment = async (filter) => {
  return Recruitment.find(filter)
    .populate("userId", "userName email collegeEmail phoneNumber")
    .populate("preferredDepartmentId secondaryDepartmentId");
};

export const updateRecruitmentStatus = async (id, status) => {
  return Recruitment.findByIdAndUpdate(
    id,
    { status },
    { returnDocument: "after" },
  );
};

export const updateApplication = async (id, updateData, session) => {
  return Recruitment.findByIdAndUpdate(id, updateData, {
    returnDocument: "after",
    session,
  });
};

export const deleteApplication = async (id) => {
  return Recruitment.findByIdAndDelete(id);
};

export const countRecruitments = async () => {
  return Recruitment.countDocuments();
};

export const getApplicationStatsByDepartment = async () => {
  return mongoose.model("Department").aggregate([
    {
      $lookup: {
        from: "recruitments",
        localField: "_id",
        foreignField: "preferredDepartmentId",
        pipeline: [
          {
            $match: {
              status: { $in: [APPLICATION_STATUS.ACTIVE, APPLICATION_STATUS.PAYMENT_PENDING] }
            }
          }
        ],
        as: "recruitments"
      }
    },
    {
      $project: {
        _id: 0,
        name: 1,
        ACTIVE: {
          $size: {
            $filter: {
              input: "$recruitments",
              as: "r",
              cond: { $eq: ["$$r.status", APPLICATION_STATUS.ACTIVE] }
            }
          }
        },
        PAYMENT_PENDING: {
          $size: {
            $filter: {
              input: "$recruitments",
              as: "r",
              cond: { $eq: ["$$r.status", APPLICATION_STATUS.PAYMENT_PENDING] }
            }
          }
        }
      }
    },
    {
      $sort: { name: 1 }
    }
  ]);
};
