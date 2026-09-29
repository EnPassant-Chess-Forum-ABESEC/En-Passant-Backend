import express from "express";
import { adminAuth, userAuth } from "../../../middleware/auth.middleware.js";
import {
  registerForEvent,
  getAllRegistrationForEvent,
  joinTeam,
} from "./event.registration.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { registerForEventValidation } from "./event.registration.validation.js";

const router = express.Router();

router.post(
  "/:id/register",
  userAuth,
  validate(registerForEventValidation),
  registerForEvent,
);

router.get("/registrations/:id", adminAuth, getAllRegistrationForEvent);
router.post("/:id/join-team", userAuth, joinTeam);

export default router;
