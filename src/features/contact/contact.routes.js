import express from "express";
import {
  createContactQuery,
  getAllContactQueries,
  updateContactQueryStatus,
} from "./contact.controller.js";
import { adminAuth } from "../../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message:
      "Too many contact requests from this IP, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post("/", contactRateLimiter, createContactQuery);
router.get("/", adminAuth, getAllContactQueries);
router.patch("/:id/status", adminAuth, updateContactQueryStatus);

export default router;
