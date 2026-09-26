import * as authService from "./auth.service.js";
import * as userRepo from "../users/user.repository.js";
import { AppError } from "../../utils/AppError.js";
import { enqueueSyncJob } from "../sync/sync.queue.js";

export const generateChesscomLoginUrl = async (req, res, next) => {
  try {
    const { codeVerifier, codeChallenge } = authService.generatePKCE();

    const state = await authService.storeAuthState(req.clerkId, codeVerifier);

    const queryParams = {
      client_id: process.env.CHESSCOM_CLIENT_ID,
      redirect_uri: process.env.CHESSCOM_REDIRECT_URI,
      response_type: "code",
      scope: "openid profile",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    };
    const loginUrl = new URL("https://oauth.chess.com/authorize");

    Object.entries(queryParams).forEach(([key, value]) => {
      loginUrl.searchParams.set(key, value);
    });

    return res.json({ authorizeUrl: loginUrl.toString() });
  } catch (error) {
    next(error);
  }
};

export const chesscomCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) throw new AppError("Code and state are required", 400);

    const savedState = await authService.getState(state);
    if (!savedState) throw new AppError("State not found", 400);

    const { clerkId, codeVerifier } = savedState;

    const userName = await authService.exchangeCodeForToken(code, codeVerifier);
    if (!userName) throw new AppError("Failed to fetch username", 500);

    const user = await userRepo.findByClerkId(clerkId);
    if (!user) throw new AppError("User not found", 404);

    const clientUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const existingUser = await userRepo.findByChessComUsername(userName);
    if (existingUser && existingUser.clerkId !== clerkId) {
      return res.redirect(`${clientUrl}/profile?chesscom_error=already_linked`);
    }

    const updatedUser = await userRepo.updateUser(clerkId, {
      "chessAccounts.chessCom.username": userName,
    });

    if (updatedUser) {
      await enqueueSyncJob(updatedUser._id, "oauth_link");
    }

    res.redirect(`${clientUrl}/profile?chesscom_linked=true`);
  } catch (error) {
    next(error);
  }
};
