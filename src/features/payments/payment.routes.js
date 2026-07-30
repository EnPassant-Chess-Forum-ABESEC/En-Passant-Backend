import express from "express";
import { userAuth } from "../../middleware/auth.middleware.js";
import {
  createCheckoutSession,
  razorpayWebhook,
  getReceipt,
} from "./payment.controller.js";

const router = express.Router();

router.post("/checkout", userAuth, createCheckoutSession);
router.post("/webhook", razorpayWebhook);
router.get("/:id/receipt", userAuth, getReceipt);

export default router;
