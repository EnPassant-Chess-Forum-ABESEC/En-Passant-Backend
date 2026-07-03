import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import connectDb from "./config/db.js";
import { errorHandler } from "./middleware/error.middleware.js";
import userRoutes from "./features/users/user.routes.js";
import leaderboardRoutes from "./features/leaderboard/leaderboard.routes.js";
import taskRoutes from "./features/tasks/task.routes.js";
import recruitmentRoutes from "./features/recruitment/recruitment.routes.js";

dotenv.config();

const app = express();

connectDb();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(clerkMiddleware());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/recruitment", recruitmentRoutes);

app.use(errorHandler);

export default app;
