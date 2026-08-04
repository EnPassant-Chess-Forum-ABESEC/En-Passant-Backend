import express from "express";
import { userAuth } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import {
  createCheckoutSession,
  razorpayWebhook,
  getReceipt,
  submitManualPayment,
} from "./payment.controller.js";

const router = express.Router();

router.post("/checkout", userAuth, createCheckoutSession);
router.post("/webhook", razorpayWebhook);
router.get("/:id/receipt", userAuth, getReceipt);
router.post(
  "/manual",
  userAuth,
  upload.single("screenshot"),
  submitManualPayment,
);

export default router;
