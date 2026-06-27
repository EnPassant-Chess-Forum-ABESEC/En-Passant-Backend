import User from "./user.model.js";

export const findByClerkId = async (clerkId) => {
  return User.findOne({ clerkId });
};

export const createUser = async (userData) => {
  return User.create(userData);
};

export const updateUser = async (clerkId, userData) => {
  return User.findOneAndUpdate({ clerkId }, userData, { new: true });
};
