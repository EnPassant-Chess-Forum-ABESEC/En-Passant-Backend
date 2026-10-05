import express from "express";
import { userAuth } from "../../../middleware/auth.middleware.js";
import {
  registerForEvent,
  getMyRegistration,
  deleteRegistration,
  joinTeam,
  leaveTeam,
  transferLeadership,
  leaveTeamAsLeader,
  getAllMyRegistrations,
} from "./event.registration.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  registerForEventValidation,
  joinCodeValidation,
} from "./event.registration.validation.js";

const router = express.Router();

// Registration
router.post(
  "/:id/register",
  userAuth,
  validate(registerForEventValidation),
  registerForEvent,
);
router.delete("/:id/delete", userAuth, deleteRegistration);

// User
router.get("/my-registrations", userAuth, getAllMyRegistrations);
router.get("/:id/my-registration", userAuth, getMyRegistration);

// Team management
router.post("/:id/join-team", userAuth, validate(joinCodeValidation), joinTeam);
router.post(
  "/:id/leave-team",
  userAuth,
  validate(joinCodeValidation),
  leaveTeam,
);
router.patch("/:id/team/leader", userAuth, transferLeadership);
router.post("/:id/team/leave-leader", userAuth, leaveTeamAsLeader);

export default router;
