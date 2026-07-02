import {
  getAllTasksByDepartment,
  getAllTasksForYear,
} from "./task.controller.js";
import { Router } from "express";
import { userAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/department", userAuth, getAllTasksByDepartment);
router.get("/", userAuth, getAllTasksForYear);

export default router;
