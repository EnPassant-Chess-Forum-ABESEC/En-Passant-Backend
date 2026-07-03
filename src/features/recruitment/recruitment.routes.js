import express from "express";
import { createApplicationSchema } from "./recruitment.validation.js";
import { userAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createApplication,
  getMyApplication,
} from "./recruitment.controller.js";

const router = express.Router();

router.post(
  "/apply",
  userAuth,
  validate(createApplicationSchema),
  createApplication,
);

router.get("/my-application", userAuth, getMyApplication);

export default router;
