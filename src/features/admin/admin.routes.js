import express from "express";
import {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  getAllDepartments,
  createDepartment,
  createTask,
} from "./admin.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  getAllApplicationsSchema,
  getApplicationByIdSchema,
  updateApplicationStatusSchema,
  createDepartmentSchema,
  createTaskSchema,
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
router.post("/tasks", adminAuth, validate(createTaskSchema), createTask);

export default router;
