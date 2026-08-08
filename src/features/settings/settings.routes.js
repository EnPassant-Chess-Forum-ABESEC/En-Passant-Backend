import express from "express";
import * as settingsController from "./settings.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/recruitment-phases", settingsController.getRecruitmentPhases);
router.put("/recruitment-phases", adminAuth, settingsController.updateRecruitmentPhases);

export default router;
