import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import connectDb from "./config/db.js";
import userRoutes from "./features/users/user.routes.js";
import leaderboardRoutes from "./features/leaderboard/leaderboard.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

connectDb();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(clerkMiddleware());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use(errorHandler);

export default app;
