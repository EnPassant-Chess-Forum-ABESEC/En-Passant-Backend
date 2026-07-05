import * as recruitmentRepo from "./recruitment.repository.js";
import { VALID_TRANSITIONS } from "./recruitment.constants.js";

export const createApplication = async (userId, data) => {
  const currentYear = new Date().getFullYear();
  const existingApplication =
    await recruitmentRepo.getRecruitmentByUserIdAndYear(userId, currentYear);

  if (existingApplication) throw new Error("Application already exists");

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

  return application;
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

export const autoRejectExpiredApplications = async () => {
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const expiredApplications =
    await recruitmentRepo.findExpiredPendingPayments(cutoffDate);

  console.log(
    `[Scheduler] Found ${expiredApplications.length} expired pending applications.`,
  );

  let deletedCount = 0;

  for (const application of expiredApplications) {
    try {
      await recruitmentRepo.deleteApplication(application._id);
      deletedCount++;
    } catch (error) {
      console.error(
        `[Scheduler] Failed to delete application ${application._id}:`,
        error.message,
      );
    }
  }

  console.log(`[Scheduler] Deleted ${deletedCount} applications.`);
  return deletedCount;
};
