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
      results.chessCom.status = "success";
      hasUpdates = true;
    } catch (error) {
      console.error(
        `[SyncEngine] Chess.com sync failed for user ${userId}:`,
        error.message,
      );
      results.chessCom.status = "failed";
      results.chessCom.error = error.message;
    }
  }

  if (user.chessAccounts?.lichess?.username) {
    try {
      const username = user.chessAccounts.lichess.username;
      const ratings = await fetchLichessRatings(username);

      user.chessAccounts.lichess.ratings = ratings;
      results.lichess.status = "success";
      hasUpdates = true;
    } catch (error) {
      console.error(
        `[SyncEngine] Lichess sync failed for user ${userId}:`,
        error.message,
      );
      results.lichess.status = "failed";
      results.lichess.error = error.message;
    }
  }

  if (hasUpdates) {
    user.chessAccounts.lastSync = new Date();
    await user.save();
  }

  return results;
};
