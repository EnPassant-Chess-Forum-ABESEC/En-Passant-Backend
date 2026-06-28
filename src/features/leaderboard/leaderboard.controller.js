import { getLeaderboard as getLeaderboardService, getUserRanks } from "./leaderboard.service.js";

export const getLeaderboard = async (req, res, next) => {
  try {
    const { timeControl = "rapid", limit = 20 } = req.query;

    const allowedControls = ["rapid", "blitz", "bullet"];

    if (!allowedControls.includes(timeControl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timeControl. Use rapid, blitz, or bullet.",
      });
    }

    const leaderboard = await getLeaderboardService(timeControl, Number(limit));

    return res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserRank = async (req, res, next) => {
  try {
    const ranks = await getUserRanks(req.clerkId);

    return res.status(200).json({
      success: true,
      data: ranks,
    });
  } catch (error) {
    next(error);
  }
};
