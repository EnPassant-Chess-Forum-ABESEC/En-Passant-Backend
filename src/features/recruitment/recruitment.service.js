import { AppError } from "../../utils/AppError.js";
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
      return await recruitmentRepo.updateApplication(
        existingApplication._id,
        data,
      );
    }
    throw new AppError(
      "Application already exists and cannot be modified.",
      409,
    );
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

  if (!application) throw new AppError("Application not found", 404);

  const submissions = await submissionRepo.findSubmissionsByApplicationId(
    application._id,
  );
  const submittedTaskIds = submissions.map(
    (sub) => sub.taskId?._id || sub.taskId,
  );

  const appObj = application.toObject();
  appObj.submittedTaskIds = submittedTaskIds;

  return appObj;
};

export const transitionStatus = async (applicationId, newStatus) => {
  const currentApplication =
    await recruitmentRepo.getRecruitmentById(applicationId);

  if (!currentApplication) throw new AppError("Application not found", 404);

  const currentStatus = currentApplication.status;

  const transition = VALID_TRANSITIONS[currentStatus];

  if (!transition || !transition.includes(newStatus)) {
    throw new AppError("Invalid transition", 400);
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

  if (!currentApplication) throw new AppError("Application not found", 404);
  if (currentApplication.paymentStatus === "SUCCESS") return currentApplication;

  const newStatus = "ACTIVE";
  const currentStatus = currentApplication.status;
  const transition = VALID_TRANSITIONS[currentStatus];

  if (!transition || !transition.includes(newStatus)) {
    throw new AppError("Invalid transition to ACTIVE", 400);
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

export const handleFailedPayment = async (applicationId, reason = null, session = null) => {
  const currentApplication =
    await recruitmentRepo.getRecruitmentById(applicationId);

  if (!currentApplication) throw new AppError("Application not found", 404);
  
  if (currentApplication.paymentStatus === "SUCCESS") return currentApplication;

  const newStatus = "PAYMENT_FAILED";
  const currentStatus = currentApplication.status;
  const transition = VALID_TRANSITIONS[currentStatus];

  if (!transition || !transition.includes(newStatus)) {
    throw new AppError("Invalid transition to PAYMENT_FAILED", 400);
  }

  const updatedApplication = await recruitmentRepo.updateApplication(
    applicationId,
    {
      status: newStatus,
      paymentStatus: "FAILED",
    },
    session,
  );

  try {
    await currentApplication.populate("userId", "userName email");
    const user = currentApplication.userId;
    if (user && user.email) {
      import("../email/email.queue.js").then((module) => {
        module.enqueuePaymentFailedEmail(user._id, user.email, user.userName, reason);
      });
    }
  } catch (err) {
    console.error("Failed to populate user for failed payment email:", err);
  }

  return updatedApplication;
};
