import express from "express";
import {
  uploadTaskSubmission,
  getTaskSubmission,
} from "./submission.controller.js";
import { userAuth, adminAuth } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/:applicationId/:taskId",
  userAuth,
  upload.array("files"),
  uploadTaskSubmission,
);

router.get("/:applicationId/:taskId", userAuth, getTaskSubmission);

export default router;
