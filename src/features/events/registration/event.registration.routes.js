import express from "express";
import { userAuth } from "../../../middleware/auth.middleware.js";
import { registerForEvent } from "./event.registration.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { registerForEventValidation } from "./event.registration.validation.js";

const router = express.Router();

router.post(
  "/:id/register",
  userAuth,
  validate(registerForEventValidation),
  registerForEvent,
);

export default router;
