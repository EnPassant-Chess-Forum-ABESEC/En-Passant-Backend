import { AppError } from "../../utils/AppError.js";
import * as recruitmentRepo from "../recruitment/recruitment.repository.js";
import * as recruitmentService from "../recruitment/recruitment.service.js";
import * as storageService from "../storage/storage.service.js";
import * as submissionRepo from "../submissions/submission.repository.js";
import * as taskRepo from "../tasks/task.repository.js";
import * as userRepo from "../users/user.repository.js";
import * as paymentRepo from "../payments/payment.repository.js";
import * as eventRepo from "../events/event.repository.js";
import { enqueueDraftReminderEmail } from "../email/email.queue.js";
import { APPLICATION_STATUS } from "../recruitment/recruitment.constants.js";
import {
  syncApplicationsToSheets,
  syncPaymentsToSheets,
} from "../../utils/googleSheets.util.js";

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

  const applications = await recruitmentRepo.findAllRecruitment(query);
  const allSubmissions = await submissionRepo.findAllSubmissions();

  const appDepts = {};
  allSubmissions.forEach((sub) => {
    const appId = sub.applicationId?.toString();
    const deptName = sub.taskId?.departmentId?.name;
    if (appId && deptName) {
      if (!appDepts[appId]) appDepts[appId] = new Set();
      appDepts[appId].add(deptName);
    }
  });

  return applications.map((app) => {
    const appObj = app.toObject ? app.toObject() : app;
    appObj.submittedDepartments = Array.from(
      appDepts[appObj._id.toString()] || [],
    );
    return appObj;
  });
};

export const getAllDepartments = async () => {
  return await taskRepo.findAllDepartments();
};

export const updatePaymentStatus = async (paymentId, status) => {
  return await paymentRepo.updatePaymentStatus(paymentId, status);
};

export const getDashboardStats = async () => {
  const [
    totalApplications,
    activeTasks,
    totalMembers,
    totalRevenue,
    chartData,
  ] = await Promise.all([
    recruitmentRepo.countRecruitments(),
    taskRepo.countTasks(),
    userRepo.countUsers(),
    paymentRepo.calculateTotalRevenue(),
    recruitmentRepo.getApplicationStatsByDepartment(),
  ]);

  return {
    totalApplications,
    activeTasks,
    totalMembers,
    totalRevenue,
    chartData,
  };
};

export const updateApplicationStatus = async (applicationId, newStatus) => {
  return await recruitmentService.transitionStatus(applicationId, newStatus);
};

export const getApplicationById = async (applicationId) => {
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
};

export const deleteApplication = async (applicationId) => {
  const application = await recruitmentRepo.getRecruitmentById(applicationId);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  await submissionRepo.deleteSubmissionsByApplicationId(applicationId);
  await paymentRepo.deletePaymentByApplicationId(applicationId);

  return await recruitmentRepo.deleteApplication(applicationId);
};

export const createDepartment = async (departmentData) => {
  const existing = await taskRepo.findDepartmentByCode(departmentData.code);

  if (existing) {
    throw new AppError("Department with this code already exists", 409);
  }

  return await taskRepo.createDepartment(departmentData);
};

export const createTask = async (taskData) => {
  return await taskRepo.createTask(taskData);
};

export const updateDepartment = async (departmentId, departmentData) => {
  const department = await taskRepo.findDepartmentById(departmentId);

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  return await taskRepo.updateDepartment(departmentId, departmentData);
};

export const deleteDepartment = async (departmentId) => {
  const department = await taskRepo.findDepartmentById(departmentId);

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  return await taskRepo.deleteDepartment(departmentId);
};

export const updateTask = async (taskId, taskData) => {
  const task = await taskRepo.findById(taskId);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return await taskRepo.updateTask(taskId, taskData);
};

export const deleteTask = async (taskId) => {
  const task = await taskRepo.findById(taskId);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return await taskRepo.deleteTask(taskId);
};

export const getUserById = async (id) => {
  const user = await userRepo.findByClerkId(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const getAllUsers = async (pageSize, pageNumber) => {
  return await userRepo.findAll(pageSize, pageNumber);
};

export const updateUserRole = async (userId, role) => {
  const user = await userRepo.updateUser(userId, { role });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const deleteUser = async (userId) => {
  const user = await userRepo.findByClerkId(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const { createClerkClient } = await import("@clerk/express");
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  await clerkClient.users.deleteUser(userId);

  await userRepo.deleteUserByClerkId(userId);

  return { success: true };
};

export const getAllPayments = async (pageSize, pageNumber) => {
  const payments = await paymentRepo.getAllPayments(pageSize, pageNumber);

  if (!payments) throw new AppError("Payments not found", 404);

  return payments;
};

export const exportApplicationsAsExcel = async (filters) => {
  const applications = await getAllApplications(filters);
  await syncApplicationsToSheets(applications);
  return { success: true, message: "Google Sheet updated successfully" };
};

export const exportPaymentsAsExcel = async () => {
  const payments = await paymentRepo.getAllPaymentsForExport();
  await syncPaymentsToSheets(payments);
  return { success: true, message: "Google Sheet updated successfully" };
};

export const sendDraftReminders = async () => {
  const draftApplications = await recruitmentRepo.findAllRecruitment({
    status: APPLICATION_STATUS.DRAFT,
  });

  let sentCount = 0;
  for (const app of draftApplications) {
    if (app.userId && app.userId.email) {
      const userName =
        app.userId.userName || app.userId.firstName || "Applicant";
      await enqueueDraftReminderEmail(
        app.userId._id,
        app.userId.email,
        userName,
      );
      sentCount++;
    }
  }

  return { count: sentCount };
};

export const getAllEvents = async () => {
  return await eventRepo.findAllEvents();
};

export const getEventById = async (eventId) => {
  const event = await eventRepo.findEventById(eventId);

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  return event;
};

export const createEvent = async (userId, eventData) => {
  return await eventRepo.createEvent({ ...eventData, createdBy: userId });
};

export const updateEvent = async (eventId, eventData) => {
  const event = await eventRepo.updateEvent(eventId, eventData);

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  return event;
};

export const deleteEvent = async (eventId) => {
  const event = await eventRepo.deleteEvent(eventId);

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  return event;
};
