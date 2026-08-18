import { AppError } from "../../utils/AppError.js";
import * as recruitmentRepo from "../recruitment/recruitment.repository.js";
import * as recruitmentService from "../recruitment/recruitment.service.js";
import * as storageService from "../storage/storage.service.js";
import * as submissionRepo from "../submissions/submission.repository.js";
import * as taskRepo from "../tasks/task.repository.js";
import * as userRepo from "../users/user.repository.js";
import * as paymentRepo from "../payments/payment.repository.js";
import { enqueueDraftReminderEmail } from "../email/email.queue.js";
import { APPLICATION_STATUS } from "../recruitment/recruitment.constants.js";
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
    if (error instanceof AppError) throw error;
    throw new AppError(`getAllApplications failed: ${error.message}`, 500);
  }
};

export const getAllDepartments = async () => {
  try {
    return await taskRepo.findAllDepartments();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`getAllDepartments failed: ${error.message}`, 500);
  }
};

export const updatePaymentStatus = async (paymentId, status) => {
  try {
    return await paymentRepo.updatePaymentStatus(paymentId, status);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`updatePaymentStatus failed: ${error.message}`, 500);
  }
};

export const getDashboardStats = async () => {
  try {
    const [totalApplications, activeTasks, totalMembers, totalRevenue] =
      await Promise.all([
        recruitmentRepo.countRecruitments(),
        taskRepo.countTasks(),
        userRepo.countUsers(),
        paymentRepo.calculateTotalRevenue(),
      ]);
    return {
      totalApplications,
      activeTasks,
      totalMembers,
      totalRevenue,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`getDashboardStats failed: ${error.message}`, 500);
  }
};

export const updateApplicationStatus = async (applicationId, newStatus) => {
  try {
    return await recruitmentService.transitionStatus(applicationId, newStatus);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`updateApplicationStatus failed: ${error.message}`, 500);
  }
};

export const getApplicationById = async (applicationId) => {
  try {
    const application = await recruitmentRepo.getRecruitmentById(applicationId);

    if (!application) {
      throw new AppError("Application not found", 404);
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
    if (error instanceof AppError) throw error;
    throw new AppError(`getApplicationById failed: ${error.message}`, 500);
  }
};

export const deleteApplication = async (applicationId) => {
  try {
    const application = await recruitmentRepo.getRecruitmentById(applicationId);

    if (!application) {
      throw new AppError("Application not found", 404);
    }

    await submissionRepo.deleteSubmissionsByApplicationId(applicationId);
    await paymentRepo.deletePaymentByApplicationId(applicationId);

    return await recruitmentRepo.deleteApplication(applicationId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`deleteApplication failed: ${error.message}`, 500);
  }
};

export const createDepartment = async (departmentData) => {
  try {
    const existing = await taskRepo.findDepartmentByCode(departmentData.code);

    if (existing) {
      throw new AppError("Department with this code already exists", 409);
    }

    return await taskRepo.createDepartment(departmentData);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`createDepartment failed: ${error.message}`, 500);
  }
};

export const createTask = async (taskData) => {
  try {
    return await taskRepo.createTask(taskData);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`createTask failed: ${error.message}`, 500);
  }
};

export const updateDepartment = async (departmentId, departmentData) => {
  try {
    const department = await taskRepo.findDepartmentById(departmentId);

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    return await taskRepo.updateDepartment(departmentId, departmentData);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`updateDepartment failed: ${error.message}`, 500);
  }
};

export const deleteDepartment = async (departmentId) => {
  try {
    const department = await taskRepo.findDepartmentById(departmentId);

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    return await taskRepo.deleteDepartment(departmentId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`deleteDepartment failed: ${error.message}`, 500);
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const task = await taskRepo.findById(taskId);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return await taskRepo.updateTask(taskId, taskData);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`updateTask failed: ${error.message}`, 500);
  }
};

export const deleteTask = async (taskId) => {
  try {
    const task = await taskRepo.findById(taskId);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return await taskRepo.deleteTask(taskId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`deleteTask failed: ${error.message}`, 500);
  }
};

export const getUserById = async (id) => {
  try {
    const user = await userRepo.findByClerkId(id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`getUserById failed: ${error.message}`, 500);
  }
};

export const getAllUsers = async (pageSize, pageNumber) => {
  try {
    const users = await userRepo.findAll(pageSize, pageNumber);

    return users;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`getAllUsers failed: ${error.message}`, 500);
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const user = await userRepo.updateUser(userId, { role });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`updateUserRole failed: ${error.message}`, 500);
  }
};

export const getAllPayments = async (pageSize, pageNumber) => {
  try {
    const payments = await paymentRepo.getAllPayments(pageSize, pageNumber);

    if (!payments) throw new AppError("Payments not found", 404);

    return payments;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`getAllPayments failed: ${error.message}`, 500);
  }
};

import {
  syncApplicationsToSheets,
  syncPaymentsToSheets,
} from "../../utils/googleSheets.util.js";

export const exportApplicationsAsExcel = async (filters) => {
  try {
    const applications = await getAllApplications(filters);
    await syncApplicationsToSheets(applications);
    return { success: true, message: "Google Sheet updated successfully" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      `exportApplicationsAsExcel failed: ${error.message}`,
      500,
    );
  }
};

export const exportPaymentsAsExcel = async () => {
  try {
    const payments = await paymentRepo.getAllPaymentsForExport();
    await syncPaymentsToSheets(payments);
    return { success: true, message: "Google Sheet updated successfully" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`exportPaymentsAsExcel failed: ${error.message}`, 500);
  }
};

export const sendDraftReminders = async () => {
  try {
    const draftApplications = await recruitmentRepo.findAllRecruitment({
      status: APPLICATION_STATUS.DRAFT,
    });

    let sentCount = 0;
    for (const app of draftApplications) {
      if (app.userId && app.userId.email) {
        const userName = app.userId.userName || app.userId.firstName || "Applicant";
        await enqueueDraftReminderEmail(app.userId._id, app.userId.email, userName);
        sentCount++;
      }
    }
    
    return { count: sentCount };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`sendDraftReminders failed: ${error.message}`, 500);
  }
};
