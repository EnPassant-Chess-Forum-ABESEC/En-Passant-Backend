import * as userRepo from "./user.repository.js";
import { enqueueSyncJob } from "../sync/sync.queue.js";

export const me = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
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
