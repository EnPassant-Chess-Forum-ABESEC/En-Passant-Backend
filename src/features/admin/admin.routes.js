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
} from "./admin.validation.js";

const router = express.Router();

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
router.post("/tasks", adminAuth, validate(createTaskSchema), createTask);
router.patch("/tasks/:id", adminAuth, validate(updateTaskSchema), updateTask);
router.delete("/tasks/:id", adminAuth, validate(deleteTaskSchema), deleteTask);

export default router;
