import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import connectDb from "./config/db.js";

dotenv.config();

const app = express();

connectDb();

app.use(express.json());
app.use(clerkMiddleware());

export default app;
