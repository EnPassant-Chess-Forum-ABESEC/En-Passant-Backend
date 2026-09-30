import express from "express";
import { adminAuth, userAuth } from "../../../middleware/auth.middleware.js";
import {
  registerForEvent,
  getAllRegistrationForEvent,
  joinTeam,
  leaveTeam,
} from "./event.registration.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  registerForEventValidation,
  joinCodeValidation,
} from "./event.registration.validation.js";

const router = express.Router();

router.post(
  "/:id/register",
  userAuth,
  validate(registerForEventValidation),
  registerForEvent,
);
router.get("/registrations/:id", adminAuth, getAllRegistrationForEvent);
router.post("/:id/join-team", userAuth, validate(joinCodeValidation), joinTeam);
router.post(
  "/:id/leave-team",
  userAuth,
  validate(joinCodeValidation),
  leaveTeam,
);
export default router;
