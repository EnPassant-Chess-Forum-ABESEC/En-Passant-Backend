import express from "express";
import { userAuth } from "../../middleware/auth.middleware.js";
import {
  createCheckoutSession,
  razorpayWebhook,
} from "./payment.controller.js";

const router = express.Router();

router.post("/checkout", userAuth, createCheckoutSession);

router.post("/webhook", razorpayWebhook);

export default router;
