import { AppError } from "../../utils/AppError.js";
import { redisConnection as redisClient } from "../../redis/redis.client.js";
import User from "../users/user.model.js";

const TIME_CONTROLS = ["rapid", "blitz", "bullet"];

const getKey = (timeControl) => `leaderboard:${timeControl}`;

export const updateUserLeaderboard = async (user) => {
  const chessCom = user?.chessAccounts?.chessCom;

  if (!chessCom?.username || !chessCom.ratings) {
    return;
  }

  try {
    for (const control of TIME_CONTROLS) {
      const rating = chessCom.ratings?.[control];
      const key = getKey(control);

      if (typeof rating === "number") {
        await redisClient.zadd(key, rating, user.clerkId);
      } else {
        await redisClient.zrem(key, user.clerkId);
      }
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`updateUserLeaderboard failed: ${error.message}`, 500);
  }
};

export const getLeaderboard = async (control, limit = 20) => {
  try {
    const key = getKey(control);

    const leaderboard = await redisClient.zrevrange(
      key,
      0,
      limit - 1,
      "WITHSCORES",
    );

    const parsedLeaderboard = [];
    for (let i = 0; i < leaderboard.length; i += 2) {
      parsedLeaderboard.push({
        member: leaderboard[i],
        score: parseFloat(leaderboard[i + 1]),
      });
    }

    const userIds = parsedLeaderboard.map((m) => m.member);
    const users = await User.find({ clerkId: { $in: userIds } });

    const userMap = new Map(users.map((u) => [u.clerkId, u]));

    return parsedLeaderboard.map((m) => {
      const user = userMap.get(m.member);

      return {
        userId: user?.clerkId,
        userName: user?.userName,
        profilePictureUrl: user?.profilePictureUrl,
        chessComUsername: user?.chessAccounts?.chessCom?.username,
        branch: user?.branch,
        year: user?.year,
        rating: m.score,
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`getLeaderboard failed: ${error.message}`, 500);
  }
};

export const getUserRanks = async (clerkId) => {
  try {
    const ranks = {};
    for (const control of TIME_CONTROLS) {
      const key = getKey(control);
      const rank = await redisClient.zrevrank(key, clerkId);
      const score = await redisClient.zscore(key, clerkId);

      if (rank !== null) {
        ranks[control] = {
          rank: rank + 1,
          rating: parseFloat(score),
        };
      } else {
        ranks[control] = null;
      }
    }
    return ranks;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`getUserRanks failed: ${error.message}`, 500);
  }
};

export const removeUserFromLeaderboard = async (clerkId) => {
  try {
    for (const control of TIME_CONTROLS) {
      const key = getKey(control);
      await redisClient.zrem(key, clerkId);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`removeUserFromLeaderboard failed: ${error.message}`, 500);
  }
};
