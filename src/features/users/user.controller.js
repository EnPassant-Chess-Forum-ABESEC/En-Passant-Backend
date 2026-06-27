import { getCurrentUser, updateUser } from "./user.service.js";

export const me = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.clerkId);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const updatedData = req.body;
    const updatedUser = await updateUser(req.clerkId, updatedData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({ success: true, message: "Profile updated", updatedUser });
  } catch (error) {
    next(error);
  }
};
