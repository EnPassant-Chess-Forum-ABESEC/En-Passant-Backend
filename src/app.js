import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import connectDb from "./config/db.js";
import userRoutes from "./features/users/userRoutes.js";

import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

connectDb();

app.use(clerkMiddleware());
app.use(express.json());

app.use("/api/users", userRoutes);

app.use(errorHandler);

export default app;
