import { Submission } from "./submission.model.js";

export const upsertSubmission = async (applicationId, taskId, updateData) => {
  return Submission.findOneAndUpdate({ applicationId, taskId }, updateData, {
    upsert: true,
    returnDocument: "after",
  });
};

export const findSubmission = async (applicationId, taskId) => {
  return Submission.findOne({ applicationId, taskId }).lean();
};

export const findSubmissionsByApplicationId = async (applicationId) => {
  return Submission.find({ applicationId }).lean();
};
