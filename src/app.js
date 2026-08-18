import express from "express";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDb from "./config/db.js";
import { errorHandler } from "./middleware/error.middleware.js";
import userRoutes from "./features/users/user.routes.js";
import leaderboardRoutes from "./features/leaderboard/leaderboard.routes.js";
import taskRoutes from "./features/tasks/task.routes.js";
import recruitmentRoutes from "./features/recruitment/recruitment.routes.js";
import paymentRoutes from "./features/payments/payment.routes.js";
import submissionRoutes from "./features/submissions/submission.routes.js";
import adminRoutes from "./features/admin/admin.routes.js";
import eventRoutes from "./features/events/event.routes.js";
import webhookRoutes from "./features/webhooks/webhook.routes.js";
import settingsRoutes from "./features/settings/settings.routes.js";
import contactRoutes from "./features/contact/contact.routes.js";

const app = express();
app.set("trust proxy", 1);

connectDb();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://www.enpassant.co.in",
      "https://enpassant.co.in",
    ].filter(Boolean),
    credentials: true,
  }),
);

app.use(clerkMiddleware());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
});

app.use(globalLimiter);

app.get("/api/health", (req, res) => {
  console.log("[server] cron pinged");
  res.status(200).json({ status: "success", message: "pong" });
});

app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/contact", contactRoutes);

app.use(errorHandler);

export default app;
