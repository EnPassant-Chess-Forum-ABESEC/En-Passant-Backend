import * as recruitmentRepo from "../recruitment/recruitment.repository.js";
import * as taskService from "../tasks/task.service.js";
import * as recruitmentService from "../recruitment/recruitment.service.js";
import * as storageService from "../storage/storage.service.js";
import * as submissionRepo from "../submissions/submission.repository.js";

export const getAllApplications = async (filters) => {
  const query = {};

  if (filters.year) {
    query.year = filters.year;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.departmentId) {
    query.preferredDepartmentId = filters.departmentId;
  }

  try {
    return await recruitmentRepo.findAllRecruitment(query);
  } catch (error) {
    throw new Error(`getAllApplications failed: ${error.message}`);
  }
};

export const getAllDepartments = async () => {
  try {
    return await taskService.getAllDepartments();
  } catch (error) {
    throw new Error(`getAllDepartments failed: ${error.message}`);
  }
};

export const updateApplicationStatus = async (applicationId, newStatus) => {
  try {
    return await recruitmentService.transitionStatus(applicationId, newStatus);
  } catch (error) {
    throw new Error(`updateApplicationStatus failed: ${error.message}`);
  }
};

export const getApplicationById = async (applicationId) => {
  try {
    const application = await recruitmentRepo.getRecruitmentById(applicationId);

    if (!application) {
      throw new Error("Application not found");
    }

    const userSubmission =
      await submissionRepo.findSubmissionsByApplicationId(applicationId);

    const submission = userSubmission.map((sub) => ({
      ...sub,
      files: sub.files?.map((file) => ({
        ...file,
        url: storageService.generateSignedUrl(file.publicId, {
          resource_type: file.resourceType,
        }),
      })),
    }));

    return { application, submission };
  } catch (error) {
    throw new Error(`getApplicationById failed: ${error.message}`);
  }
};
