import { workerLogger } from "../../utils/logger.js";
import User from "../users/user.model.js";
import { fetchChessComRatings } from "./adapters/chesscom.adapter.js";
import { fetchLichessRatings } from "./adapters/lichess.adapter.js";

export const syncUserAccounts = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`Sync Error: User with ID ${userId} not found in DB`);
  }

  const results = {
    chessCom: { status: "skipped", error: null },
    lichess: { status: "skipped", error: null },
  };

  let hasUpdates = false;

  if (user.chessAccounts?.chessCom?.username) {
    try {
      const username = user.chessAccounts.chessCom.username;
      const ratings = await fetchChessComRatings(username);

      user.chessAccounts.chessCom.ratings = ratings;
      user.chessAccounts.chessCom.status = "synced";
      user.chessAccounts.chessCom.lastSync = new Date();
      user.chessAccounts.chessCom.lastError = null;
      results.chessCom.status = "success";
      hasUpdates = true;
    } catch (error) {
      workerLogger.error(
        `[SyncEngine] Chess.com sync failed for user ${userId}:`,
        error.message,
      );
      user.chessAccounts.chessCom.status = "failed";
      user.chessAccounts.chessCom.lastError = error.message;
      results.chessCom.status = "failed";
      results.chessCom.error = error.message;
      hasUpdates = true;
    }
  }

  if (user.chessAccounts?.lichess?.username) {
    try {
      const username = user.chessAccounts.lichess.username;
      const ratings = await fetchLichessRatings(username);

      user.chessAccounts.lichess.ratings = ratings;
      user.chessAccounts.lichess.status = "synced";
      user.chessAccounts.lichess.lastSync = new Date();
      user.chessAccounts.lichess.lastError = null;
      results.lichess.status = "success";
      hasUpdates = true;
    } catch (error) {
      workerLogger.error(
        `[SyncEngine] Lichess sync failed for user ${userId}:`,
        error.message,
      );
      user.chessAccounts.lichess.status = "failed";
      user.chessAccounts.lichess.lastError = error.message;
      results.lichess.status = "failed";
      results.lichess.error = error.message;
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await user.save();

    try {
      const { updateUserLeaderboard } =
        await import("../leaderboard/leaderboard.service.js");
      await updateUserLeaderboard(user);
    } catch (err) {
      workerLogger.error(
        `[SyncEngine] Failed to update leaderboard for user ${userId}:`,
        err.message,
      );
    }
  }

  return results;
};
