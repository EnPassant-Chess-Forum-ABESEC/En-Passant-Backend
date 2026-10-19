import crypto from "node:crypto";
import { redisConnection as redisClient } from "../../redis/redis.client.js";
import { AppError } from "../../utils/AppError.js";
import jwt from "jsonwebtoken";

export const generatePKCE = () => {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");

  const hash = crypto.createHash("sha256").update(codeVerifier);

  const codeChallenge = hash.digest("base64url");

  return { codeVerifier, codeChallenge };
};

export const storeAuthState = async (clerkId, codeVerifier) => {
  try {
    const state = crypto.randomUUID();

    const value = JSON.stringify({
      clerkId,
      codeVerifier,
    });
    await redisClient.setex(`state:${state}`, 60 * 5, value);
    return state;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`storeAuthState failed: ${error.message}`, 500);
  }
};

export const exchangeCodeForToken = async (code, codeVerifier) => {
  try {
    const urlSearchParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.CHESSCOM_CLIENT_ID,
      redirect_uri: process.env.CHESSCOM_REDIRECT_URI,
      code,
      code_verifier: codeVerifier,
    });

    const res = await fetch("https://oauth.chess.com/token", {
      method: "POST",
      body: urlSearchParams,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok)
      throw new AppError(
        `exchangeCodeForToken failed: ${res.statusText}`,
        res.status,
      );

    const data = await res.json();

    const idToken = data.id_token;

    const decoded = jwt.decode(idToken);

    if (!decoded)
      throw new AppError(`exchangeCodeForToken failed: Invalid ID token`, 400);

    const userName = decoded.username || decoded.preferred_username;

    if (!userName) throw new AppError("Username not found in ID Token", 400);

    return userName;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`exchangeCodeForToken failed: ${error.message}`, 500);
  }
};

export const getState = async (state) => {
  try {
    const value = await redisClient.get(`state:${state}`);

    if (!value) return null;

    await redisClient.del(`state:${state}`);

    return JSON.parse(value);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`getState failed: ${error.message}`, 500);
  }
};
