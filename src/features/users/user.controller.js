import * as userRepo from "./user.repository.js";
import { enqueueSyncJob } from "../sync/sync.queue.js";
import { getUserRanks } from "../leaderboard/leaderboard.service.js";
import ChessVerification from "./chessVerification.model.js";



const generateVerificationToken = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CHESS-${code}`;
};

export const me = async (req, res, next) => {
  try {


    const userObj = req.user.toObject();

    try {
      const ranks = await getUserRanks(req.clerkId);
      userObj.ranks = ranks;
    } catch (err) {
      console.error("Failed to fetch user ranks from Redis:", err);
      userObj.ranks = null;
    }

    res.json({ success: true, user: userObj });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req, res, next) => {
  try {
    const { userName } = req.params;
    


    const user = await userRepo.findByUserName(userName);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userObj = user.toObject();

    const publicProfile = {
      userName: userObj.userName,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      fullName: userObj.fullName,
      branch: userObj.branch,
      year: userObj.year,
      chessAccounts: userObj.chessAccounts,
      avatarUrl: userObj.profilePictureUrl,
      createdAt: userObj.createdAt,
    };

    try {
      const ranks = await getUserRanks(userObj.clerkId);
      publicProfile.ranks = ranks;
    } catch (err) {
      console.error("Failed to fetch user ranks from Redis:", err);
      publicProfile.ranks = null;
    }

    res.json({ success: true, user: publicProfile });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {


    if (req.body.chessAccounts?.chessCom?.username !== undefined) {
      const oldUsername = req.user.chessAccounts?.chessCom?.username;
      const newUsername = req.body.chessAccounts.chessCom.username;
      
      if (oldUsername && oldUsername.toLowerCase() === newUsername.toLowerCase()) {
        const existingChessComObj = req.user.chessAccounts?.chessCom;
        req.body.chessAccounts.chessCom = {
          ...(existingChessComObj?.toObject ? existingChessComObj.toObject() : existingChessComObj),
          username: newUsername,
        };
      } else {
        req.body.chessAccounts.chessCom.verified = false;
      }
    }

    const updatedUser = await userRepo.updateUser(req.clerkId, req.body);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.body.chessAccounts) {
      await enqueueSyncJob(updatedUser._id, "profile_update");
    }

    res.json({
      success: true,
      message: "Profile updated",
      updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const onboardUser = async (req, res, next) => {
  try {


    if (req.user.isOnboardingComplete) {
      return res.status(400).json({
        success: false,
        message: "User is already onboarded",
      });
    }

    if (req.body.chessAccounts?.chessCom?.username !== undefined) {
      req.body.chessAccounts.chessCom.verified = false;
    }

    const updatedUser = await userRepo.updateUser(req.clerkId, {
      ...req.body,
      isOnboardingComplete: true,
    });

    if (req.body.chessAccounts) {
      await enqueueSyncJob(updatedUser._id, "onboarding");
    }

    res.json({
      success: true,
      message: "Onboarding complete",
      updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const startChessVerification = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: "Chess.com username is required" });
    }



    await ChessVerification.deleteMany({ userId: req.user._id, status: "pending" });

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const verification = await ChessVerification.create({
      userId: req.user._id,
      username: username.trim(),
      token,
      expiresAt,
      status: "pending",
    });

    res.json({
      success: true,
      data: {
        username: verification.username,
        token: verification.token,
        expiresAt: verification.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyChessVerification = async (req, res, next) => {
  try {


    const verification = await ChessVerification.findOne({
      userId: req.user._id,
      status: "pending",
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "No pending verification found. Please start verification first.",
      });
    }

    if (new Date() > verification.expiresAt) {
      verification.status = "expired";
      await verification.save();
      return res.status(400).json({
        success: false,
        message: "Verification token has expired. Please start again.",
      });
    }

    const url = `https://api.chess.com/pub/player/${encodeURIComponent(verification.username)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "EnPassantApp (kaustubh.24b0101134@abes.ac.in)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          message: `Chess.com user '${verification.username}' not found. Please check the spelling.`,
        });
      }
      return res.status(502).json({
        success: false,
        message: "Failed to fetch profile from Chess.com. Please try again later.",
      });
    }

    const data = await response.json();
    const name = data.name || "";
    const token = verification.token;

    const nameParts = name.trim().split(/\s+/);
    const lastName = nameParts[nameParts.length - 1] || "";
    const isMatch = lastName.toUpperCase() === token.toUpperCase();

    if (!isMatch) {
      let message = "Verification token not found in your Chess.com profile name.";
      if (!name.trim()) {
        message += " We found that your Chess.com 'Display Name' is currently empty. Make sure you set a Display Name in your Chess.com settings (and put the code in the Last Name field).";
      }
      message += " Note that Chess.com may take a few minutes to update its public API. Please try again.";
      return res.status(400).json({
        success: false,
        message,
      });
    }

    verification.status = "verified";
    await verification.save();

    const user = req.user;
    if (!user.chessAccounts) {
      user.chessAccounts = {};
    }
    user.chessAccounts.chessCom = {
      username: verification.username,
      verified: true,
      status: "pending",
      ratings: user.chessAccounts.chessCom?.ratings || { blitz: 0, bullet: 0, rapid: 0 },
    };
    await user.save();

    try {
      await enqueueSyncJob(user._id, "profile_update");
    } catch (syncErr) {
      console.error("Failed to enqueue sync job after verification:", syncErr);
    }

    res.json({
      success: true,
      message: "Chess.com profile verified successfully!",
      username: verification.username,
    });
  } catch (error) {
    next(error);
  }
};
