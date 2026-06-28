import express from "express";
import { getLeaderboard, getUserRank } from "./leaderboard.controller.js";
import { userAuth } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getLeaderboard);
router.get("/my-rank", userAuth, getUserRank);

export default router;
