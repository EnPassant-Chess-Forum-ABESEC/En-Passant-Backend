import express from "express";
import * as adminController from "./admin.controller.js";
import * as adminValidation from "./admin.validation.js";
import * as eventValidation from "../events/event.validation.js";
import { adminAuth } from "../../middleware/auth.middleware.js";
import { auditPresenceMiddleware } from "../../middleware/audit.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";

const router = express.Router();

router.use(adminAuth);
router.use(auditPresenceMiddleware);

// recruitment management
router.get(
  "/applications",
  validate(adminValidation.getAllApplicationsSchema),
  adminController.getAllApplications,
);
router.get("/applications/export", adminController.exportApplications);
router.get(
  "/applications/:id",
  validate(adminValidation.getApplicationByIdSchema),
  adminController.getApplicationById,
);
router.patch(
  "/applications/:id/status",
  validate(adminValidation.updateApplicationStatusSchema),
  adminController.updateApplicationStatus,
);
router.delete(
  "/applications/:id",
  validate(adminValidation.deleteApplicationSchema),
  adminController.deleteApplication,
);
router.post("/applications/remind-drafts", adminController.sendDraftReminders);

// event registration management
router.get(
  "/event-registrations/:id",
  validate(eventValidation.getEventByIdSchema),
  adminController.getAllRegistrationForEvent,
);
router.delete(
  "/event-registrations/:id",
  adminController.deleteEventRegistration,
);

// department management
router.get("/departments", adminController.getAllDepartments);
router.post(
  "/departments",
  validate(adminValidation.createDepartmentSchema),
  adminController.createDepartment,
);
router.patch(
  "/departments/:id",
  validate(adminValidation.updateDepartmentSchema),
  adminController.updateDepartment,
);
router.delete(
  "/departments/:id",
  validate(adminValidation.deleteDepartmentSchema),
  adminController.deleteDepartment,
);

// task management
router.post(
  "/tasks",
  validate(adminValidation.createTaskSchema),
  adminController.createTask,
);
router.patch(
  "/tasks/:id",
  validate(adminValidation.updateTaskSchema),
  adminController.updateTask,
);
router.delete(
  "/tasks/:id",
  validate(adminValidation.deleteTaskSchema),
  adminController.deleteTask,
);

// user management
router.post("/users/sync-all", adminController.syncAllUsers);
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.patch(
  "/users/:id/role",
  validate(adminValidation.updateUserRoleSchema),
  adminController.updateUserRole,
);
router.delete("/users/:id", adminController.deleteUser);

// system management
router.post("/redis/clean", adminController.cleanRedisSets);
router.post("/cloud/clean", adminController.cleanCloudFiles);

// payments
router.get("/payments", adminController.getAllPayments);
router.get("/payments/export", adminController.exportPayments);
router.patch(
  "/payments/:id/verify",
  validate(adminValidation.verifyPaymentSchema),
  adminController.verifyPayment,
);
router.post("/payments/retry-receipts", adminController.retryMissingReceipts);

// admin stats
router.get("/stats", adminController.getDashboardStats);

// event management
router.get("/events", adminController.getAllEvents);
router.get(
  "/events/:id",
  validate(eventValidation.getEventByIdSchema),
  adminController.getEventById,
);
router.post(
  "/events",
  validate(eventValidation.createEventSchema),
  adminController.createEvent,
);
router.patch(
  "/events/:id",
  validate(eventValidation.updateEventSchema),
  adminController.updateEvent,
);
router.delete(
  "/events/:id",
  validate(eventValidation.deleteEventSchema),
  adminController.deleteEvent,
);

export default router;
