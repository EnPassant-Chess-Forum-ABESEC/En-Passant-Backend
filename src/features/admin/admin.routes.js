import express from "express";
import {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createTask,
  updateTask,
  deleteTask,
  getAllUsers,
  getUserById,
  updateUserRole,
  getAllPayments,
  verifyPayment,
  exportApplications,
  exportPayments,
  syncAllUsers,
  deleteApplication,
  cleanRedisSets,
  cleanCloudFiles,
  sendDraftReminders,
  getDashboardStats,
} from "./admin.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  getAllApplicationsSchema,
  getApplicationByIdSchema,
  updateApplicationStatusSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  deleteDepartmentSchema,
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  updateUserRoleSchema,
  verifyPaymentSchema,
  deleteApplicationSchema,
} from "./admin.validation.js";

const router = express.Router();

// recruitment management
router.get(
  "/applications",
  adminAuth,
  validate(getAllApplicationsSchema),
  getAllApplications,
);
router.get("/applications/export", adminAuth, exportApplications);
router.get(
  "/applications/:id",
  adminAuth,
  validate(getApplicationByIdSchema),
  getApplicationById,
);
router.patch(
  "/applications/:id/status",
  adminAuth,
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);
router.delete(
  "/applications/:id",
  adminAuth,
  validate(deleteApplicationSchema),
  deleteApplication,
);
router.post("/applications/remind-drafts", adminAuth, sendDraftReminders);

// department management
router.get("/departments", adminAuth, getAllDepartments);
router.post(
  "/departments",
  adminAuth,
  validate(createDepartmentSchema),
  createDepartment,
);
router.patch(
  "/departments/:id",
  adminAuth,
  validate(updateDepartmentSchema),
  updateDepartment,
);
router.delete(
  "/departments/:id",
  adminAuth,
  validate(deleteDepartmentSchema),
  deleteDepartment,
);

// task management
router.post("/tasks", adminAuth, validate(createTaskSchema), createTask);
router.patch("/tasks/:id", adminAuth, validate(updateTaskSchema), updateTask);
router.delete("/tasks/:id", adminAuth, validate(deleteTaskSchema), deleteTask);

// user management
router.post("/users/sync-all", adminAuth, syncAllUsers);
router.get("/users", adminAuth, getAllUsers);
router.get("/users/:id", adminAuth, getUserById);
router.patch(
  "/users/:id/role",
  adminAuth,
  validate(updateUserRoleSchema),
  updateUserRole,
);

// system management
router.post("/redis/clean", adminAuth, cleanRedisSets);
router.post("/cloud/clean", adminAuth, cleanCloudFiles);

// payments
router.get("/payments", adminAuth, getAllPayments);
router.get("/payments/export", adminAuth, exportPayments);
router.patch(
  "/payments/:id/verify",
  adminAuth,
  validate(verifyPaymentSchema),
  verifyPayment,
);

// admin stats
router.get("/stats", adminAuth, getDashboardStats);

export default router;
