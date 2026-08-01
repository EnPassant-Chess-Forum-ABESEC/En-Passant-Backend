import {
  getAllTasksByDepartment,
  getAllTasksForYear,
  getAllDepartments,
} from "./task.controller.js";
import { Router } from "express";
import { userAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/department", userAuth, getAllTasksByDepartment);
router.get("/", userAuth, getAllTasksForYear);

// public department route
router.get("/all-departments", getAllDepartments);

export default router;
