import * as recruitmentRepo from "../recruitment/recruitment.repository.js";
import * as taskService from "../tasks/task.service.js";
import * as recruitmentService from "../recruitment/recruitment.service.js";
import * as storageService from "../storage/storage.service.js";
import * as submissionRepo from "../submissions/submission.repository.js";
import * as taskRepo from "../tasks/task.repository.js";
import * as userRepo from "../users/user.repository.js";
import * as paymentRepo from "../payments/payment.repository.js";

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

export const createDepartment = async (departmentData) => {
  try {
    const existing = await taskRepo.findDepartmentByCode(departmentData.code);

    if (existing) {
      throw new Error("Department with this code already exists");
    }

    return await taskRepo.createDepartment(departmentData);
  } catch (error) {
    throw new Error(`createDepartment failed: ${error.message}`);
  }
};

export const createTask = async (taskData) => {
  try {
    return await taskRepo.createTask(taskData);
  } catch (error) {
    throw new Error(`createTask failed: ${error.message}`);
  }
};

export const updateDepartment = async (departmentId, departmentData) => {
  try {
    const department = await taskRepo.findDepartmentById(departmentId);

    if (!department) {
      throw new Error("Department not found");
    }

    return await taskRepo.updateDepartment(departmentId, departmentData);
  } catch (error) {
    throw new Error(`updateDepartment failed: ${error.message}`);
  }
};

export const deleteDepartment = async (departmentId) => {
  try {
    const department = await taskRepo.findDepartmentById(departmentId);

    if (!department) {
      throw new Error("Department not found");
    }

    return await taskRepo.deleteDepartment(departmentId);
  } catch (error) {
    throw new Error(`deleteDepartment failed: ${error.message}`);
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const task = await taskRepo.findTaskById(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    return await taskRepo.updateTask(taskId, taskData);
  } catch (error) {
    throw new Error(`updateTask failed: ${error.message}`);
  }
};

export const deleteTask = async (taskId) => {
  try {
    const task = await taskRepo.findTaskById(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    return await taskRepo.deleteTask(taskId);
  } catch (error) {
    throw new Error(`deleteTask failed: ${error.message}`);
  }
};

export const getUserById = async (id) => {
  try {
    const user = await userRepo.findByClerkId(id);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error(`getUserById failed: ${error.message}`);
  }
};

export const getAllUsers = async (pageSize, pageNumber) => {
  try {
    const users = await userRepo.findAll(pageSize, pageNumber);

    return users;
  } catch (error) {
    throw new Error(`getAllUsers failed: ${error.message}`);
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const user = await userRepo.updateUser(userId, { role });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error(`updateUserRole failed: ${error.message}`);
  }
};

export const getAllPayments = async (pageSize, pageNumber) => {
  try {
    const payments = await paymentRepo.getAllPayments(pageSize, pageNumber);

    if (!payments) throw new Error("Payments not found");

    return payments;
  } catch (error) {
    throw new Error(`getAllPayments failed: ${error.message}`);
  }
};
