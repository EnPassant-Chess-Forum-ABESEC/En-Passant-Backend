import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "./event.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createEventSchema,
  updateEventSchema,
  getEventByIdSchema,
  deleteEventSchema,
  getAllEventsSchema,
} from "./event.validation.js";

const router = express.Router();

router.get("/", validate(getAllEventsSchema), getAllEvents);
router.get("/:id", validate(getEventByIdSchema), getEventById);

router.post("/", adminAuth, validate(createEventSchema), createEvent);
router.patch("/:id", adminAuth, validate(updateEventSchema), updateEvent);
router.delete("/:id", adminAuth, validate(deleteEventSchema), deleteEvent);

export default router;
