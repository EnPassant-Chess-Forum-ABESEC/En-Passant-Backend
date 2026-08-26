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
  retryMissingReceipts,
  deleteUser,
} from "./admin.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";
import { auditPresenceMiddleware } from "../../middleware/audit.middleware.js";
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

router.use(adminAuth);
router.use(auditPresenceMiddleware);

// recruitment management
router.get(
  "/applications",
  validate(getAllApplicationsSchema),
  getAllApplications,
);
router.get("/applications/export", exportApplications);
router.get(
  "/applications/:id",
  validate(getApplicationByIdSchema),
  getApplicationById,
);
router.patch(
  "/applications/:id/status",
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);
router.delete(
  "/applications/:id",
  validate(deleteApplicationSchema),
  deleteApplication,
);
router.post("/applications/remind-drafts", sendDraftReminders);

// department management
router.get("/departments", getAllDepartments);
router.post("/departments", validate(createDepartmentSchema), createDepartment);
router.patch(
  "/departments/:id",
  validate(updateDepartmentSchema),
  updateDepartment,
);
router.delete(
  "/departments/:id",
  validate(deleteDepartmentSchema),
  deleteDepartment,
);

// task management
router.post("/tasks", validate(createTaskSchema), createTask);
router.patch("/tasks/:id", validate(updateTaskSchema), updateTask);
router.delete("/tasks/:id", validate(deleteTaskSchema), deleteTask);

// user management
router.post("/users/sync-all", syncAllUsers);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/role", validate(updateUserRoleSchema), updateUserRole);
router.delete("/users/:id", deleteUser);

// system management
router.post("/redis/clean", cleanRedisSets);
router.post("/cloud/clean", cleanCloudFiles);

// payments
router.get("/payments", getAllPayments);
router.get("/payments/export", exportPayments);
router.patch(
  "/payments/:id/verify",
  validate(verifyPaymentSchema),
  verifyPayment,
);
router.post("/payments/retry-receipts", retryMissingReceipts);

// admin stats
router.get("/stats", getDashboardStats);

export default router;
