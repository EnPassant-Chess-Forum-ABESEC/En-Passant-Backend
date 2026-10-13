import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "./event.controller.js";
import {
  initializeEventTournaments,
  seedPlayers,
  getDashboard,
  pairRound,
  getStandings,
  recordGameResult,
  exportBracketRoundPdf,
} from "./eventTournament.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createEventSchema,
  updateEventSchema,
  getEventByIdSchema,
  deleteEventSchema,
} from "./event.validation.js";
import {
  initializeEventTournamentsSchema,
  seedPlayersSchema,
  pairEventRoundSchema,
} from "./eventTournament.validation.js";

const router = express.Router();

router.get("/", getAllEvents);
router.get("/:id", validate(getEventByIdSchema), getEventById);

router.post("/", adminAuth, validate(createEventSchema), createEvent);
router.patch("/:id", adminAuth, validate(updateEventSchema), updateEvent);
router.delete("/:id", adminAuth, validate(deleteEventSchema), deleteEvent);

router.post(
  "/:id/tournaments/initialize",
  adminAuth,
  validate(initializeEventTournamentsSchema),
  initializeEventTournaments,
);

router.post(
  "/:id/tournaments/seed",
  adminAuth,
  validate(seedPlayersSchema),
  seedPlayers,
);

router.get("/:id/tournaments/dashboard", getDashboard);

router.post(
  "/:id/tournaments/pair",
  adminAuth,
  validate(pairEventRoundSchema),
  pairRound,
);

router.get("/:id/tournaments/standings", getStandings);

router.post(
  "/:id/tournaments/:section/:bracket/result",
  adminAuth,
  recordGameResult,
);

router.get(
  "/:id/tournaments/:section/:bracket/rounds/:roundNumber/pdf",
  exportBracketRoundPdf,
);

export default router;