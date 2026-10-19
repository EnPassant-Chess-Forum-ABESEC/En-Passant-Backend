import { Router } from "express";
import { userAuth } from "../../middleware/auth.middleware.js";
import {
  generateChesscomLoginUrl,
  chesscomCallback,
} from "./auth.controller.js";

const router = Router();

router.post("/chesscom/login", userAuth, generateChesscomLoginUrl);

router.get("/chesscom/callback", chesscomCallback);

export default router;
