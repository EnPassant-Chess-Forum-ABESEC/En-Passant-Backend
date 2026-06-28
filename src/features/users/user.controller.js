import {
  updateUserService,
  getUserByIdService,
  getAllUsersService,
} from "./user.service.js";
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
    const updatedUser = await updateUserService(req.clerkId, req.body);

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

    const updatedUser = await updateUserService(req.clerkId, {
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

export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdService(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const pageNumber = Number(req.query.pageNumber) || 1;

    const users = await getAllUsersService(pageSize, pageNumber);

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};
