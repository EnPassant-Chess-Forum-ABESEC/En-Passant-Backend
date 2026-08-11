import * as recruitmentRepo from "./recruitment.repository.js";
import * as submissionRepo from "../submissions/submission.repository.js";
import { VALID_TRANSITIONS } from "./recruitment.constants.js";

export const createApplication = async (userId, data) => {
  const currentYear = new Date().getFullYear();
  const existingApplication =
    await recruitmentRepo.getRecruitmentByUserIdAndYear(userId, currentYear);

  if (existingApplication) {
    if (
      existingApplication.status === "DRAFT" ||
      existingApplication.status === "PAYMENT_PENDING" ||
      existingApplication.status === "PAYMENT_FAILED"
    ) {
      return await recruitmentRepo.updateApplication(existingApplication._id, data);
    }
    throw new Error("Application already exists and cannot be modified.");
  }

  return await recruitmentRepo.createRecruitment({
    userId,
    year: currentYear,
    ...data,
  });
};

export const getMyApplication = async (userId, year) => {
  const application = await recruitmentRepo.getRecruitmentByUserIdAndYear(
    userId,
    year,
  );

  if (!application) throw new Error("Application not found");

  const submissions = await submissionRepo.findSubmissionsByApplicationId(application._id);
  const submittedTaskIds = submissions.map(sub => sub.taskId?._id || sub.taskId);

  const appObj = application.toObject();
  appObj.submittedTaskIds = submittedTaskIds;

  return appObj;
};

export const transitionStatus = async (applicationId, newStatus) => {
  const currentApplication =
    await recruitmentRepo.getRecruitmentById(applicationId);

  if (!currentApplication) throw new Error("Application not found");

  const currentStatus = currentApplication.status;

  const transition = VALID_TRANSITIONS[currentStatus];

  if (!transition || !transition.includes(newStatus)) {
    throw new Error("Invalid transition");
  }

  return await recruitmentRepo.updateRecruitmentStatus(
    applicationId,
    newStatus,
  );
};

export const handleSuccessfulPayment = async (
  applicationId,
  transactionId,
  session,
) => {
  const currentApplication =
    await recruitmentRepo.getRecruitmentById(applicationId);

  if (!currentApplication) throw new Error("Application not found");
  if (currentApplication.paymentStatus === "SUCCESS") return currentApplication;

  const newStatus = "ACTIVE";
  const currentStatus = currentApplication.status;
  const transition = VALID_TRANSITIONS[currentStatus];

  if (!transition || !transition.includes(newStatus)) {
    throw new Error("Invalid transition to ACTIVE");
  }

  return await recruitmentRepo.updateApplication(
    applicationId,
    {
      status: newStatus,
      paymentStatus: "SUCCESS",
      transactionId: transactionId,
    },
    session,
  );
};
