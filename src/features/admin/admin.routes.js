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
} from "./admin.validation.js";

const router = express.Router();

// recruitment management
router.get(
  "/applications",
  adminAuth,
  validate(getAllApplicationsSchema),
  getAllApplications,
);
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
router.get("/users", adminAuth, getAllUsers);
router.get("/users/:id", adminAuth, getUserById);
router.patch(
  "/users/:id/role",
  adminAuth,
  validate(updateUserRoleSchema),
  updateUserRole,
);

// payments
router.get("/payments", adminAuth, getAllPayments);

export default router;
