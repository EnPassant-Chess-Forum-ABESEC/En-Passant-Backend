import { updateUser } from "./user.service.js";

export const me = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
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
